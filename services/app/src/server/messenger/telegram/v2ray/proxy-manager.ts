import { connect } from 'node:net'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { request as httpsRequest } from 'node:https'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { ensureXrayBinary } from './xray-binary'
import { buildXrayConfig } from './xray-config'
import { parseVlessUri, type ParsedVlessConfig } from './parse-vless'

export type SocksEndpoint = {
  host: string
  port: number
  url: string
}

export type ProxyTestResult = {
  ok: boolean
  error?: string
  socks?: SocksEndpoint
  latencyMs?: number
  remark?: string
}

type RunningProxy = {
  process: ChildProcessWithoutNullStreams
  workDir: string
  socks: SocksEndpoint
  configUri: string
  config: ParsedVlessConfig
}

/**
 * Process-wide singleton. Next.js may load this module twice (custom server
 * via tsx vs App Router bundle); module-local `let` would spawn two Xrays
 * and leave the poller without SOCKS while API routes think proxy is up.
 */
type ProxyGlobals = {
  running: RunningProxy | null
  startLock: Promise<unknown> | null
}

const PROXY_GLOBAL_KEY = '__vakilaTelegramProxy' as const

function proxyGlobals(): ProxyGlobals {
  const g = globalThis as typeof globalThis & {
    [PROXY_GLOBAL_KEY]?: ProxyGlobals
  }
  if (!g[PROXY_GLOBAL_KEY]) {
    g[PROXY_GLOBAL_KEY] = { running: null, startLock: null }
  }
  return g[PROXY_GLOBAL_KEY]
}

function getRunning(): RunningProxy | null {
  return proxyGlobals().running
}

function setRunning(value: RunningProxy | null): void {
  proxyGlobals().running = value
}

function getStartLock(): Promise<unknown> | null {
  return proxyGlobals().startLock
}

function setStartLock(value: Promise<unknown> | null): void {
  proxyGlobals().startLock = value
}

function socksUrl(port: number): string {
  return `socks5h://127.0.0.1:${port}`
}

async function getFreePort(): Promise<number> {
  const { createServer } = await import('node:net')
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('نتوانست پورت آزاد برای SOCKS5 پیدا کند.'))
        return
      }
      const { port } = address
      server.close((err) => (err ? reject(err) : resolve(port)))
    })
    server.on('error', reject)
  })
}

async function waitForPortOpen(port: number, timeoutMs = 10_000): Promise<void> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = connect({ host: '127.0.0.1', port }, () => {
          socket.end()
          resolve()
        })
        socket.on('error', reject)
        socket.setTimeout(400, () => {
          socket.destroy()
          reject(new Error('timeout'))
        })
      })
      return
    } catch {
      await delay(150)
    }
  }
  throw new Error('پروکسی SOCKS5 به‌موقع بالا نیامد.')
}

export async function httpsGetViaSocks(
  url: string,
  socks: SocksEndpoint
): Promise<{ status: number; latencyMs: number }> {
  const agent = new SocksProxyAgent(socks.url)
  const started = Date.now()

  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      url,
      {
        method: 'GET',
        agent,
        timeout: 20_000,
        headers: { 'User-Agent': 'vakila-telegram-proxy-test' },
      },
      (res) => {
        res.resume()
        resolve({
          status: res.statusCode ?? 0,
          latencyMs: Date.now() - started,
        })
      }
    )
    req.on('timeout', () => {
      req.destroy(new Error('اتمام زمان انتظار در اتصال از طریق SOCKS5'))
    })
    req.on('error', reject)
    req.end()
  })
}

async function spawnXray(
  config: ParsedVlessConfig,
  configUri: string
): Promise<RunningProxy> {
  const binary = await ensureXrayBinary()
  const socksPort = await getFreePort()
  const workDir = await mkdtemp(join(tmpdir(), 'vakila-xray-'))
  const configPath = join(workDir, 'config.json')
  await writeFile(
    configPath,
    JSON.stringify(buildXrayConfig(config, socksPort), null, 2),
    'utf8'
  )

  const child = spawn(binary, ['run', '-c', configPath], {
    cwd: workDir,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let stderr = ''
  const appendErr = (chunk: Buffer) => {
    stderr += chunk.toString('utf8')
    if (stderr.length > 4000) stderr = stderr.slice(-4000)
  }
  child.stderr.on('data', appendErr)
  child.stdout.on('data', appendErr)

  const socks: SocksEndpoint = {
    host: '127.0.0.1',
    port: socksPort,
    url: socksUrl(socksPort),
  }

  const exitPromise = new Promise<never>((_, reject) => {
    child.once('exit', (code, signal) => {
      reject(
        new Error(
          `فرآیند Xray زودتر از موعد بسته شد (code=${code ?? 'null'} signal=${signal ?? 'null'}). ${stderr.trim()}`
        )
      )
    })
    child.once('error', reject)
  })

  try {
    await Promise.race([waitForPortOpen(socksPort), exitPromise])
  } catch (error) {
    if (!child.killed) child.kill('SIGTERM')
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined)
    throw error
  }

  // Detach exit listener used only during startup race
  child.removeAllListeners('exit')
  child.removeAllListeners('error')
  child.on('exit', (code, signal) => {
    console.error(
      `[telegram-proxy] Xray exited (code=${code ?? 'null'} signal=${signal ?? 'null'})`
    )
    if (getRunning()?.process === child) {
      setRunning(null)
    }
  })

  return {
    process: child,
    workDir,
    socks,
    configUri,
    config,
  }
}

async function stopRunning(instance: RunningProxy | null): Promise<void> {
  if (!instance) return
  const { process: child, workDir } = instance
  if (!child.killed) {
    child.kill('SIGTERM')
    await Promise.race([
      new Promise<void>((resolve) => child.once('exit', () => resolve())),
      delay(2000),
    ])
    if (!child.killed) child.kill('SIGKILL')
  }
  await rm(workDir, { recursive: true, force: true }).catch(() => undefined)
}

export function getActiveSocksEndpoint(): SocksEndpoint | null {
  return getRunning()?.socks ?? null
}

export function getActiveProxyRemark(): string | null {
  return getRunning()?.config.remark ?? null
}

export function isProxyRunning(): boolean {
  const running = getRunning()
  return Boolean(running && !running.process.killed)
}

export async function stopTelegramProxy(): Promise<void> {
  const run = async () => {
    const current = getRunning()
    setRunning(null)
    await stopRunning(current)
  }
  const existingLock = getStartLock()
  if (existingLock) await existingLock.catch(() => undefined)
  const promise = run().finally(() => {
    setStartLock(null)
  })
  setStartLock(promise)
  await promise
}

export async function ensureTelegramProxy(
  configUri: string
): Promise<SocksEndpoint> {
  const parsed = parseVlessUri(configUri)
  if (!parsed.ok) {
    throw new Error(parsed.error)
  }

  const run = async (): Promise<SocksEndpoint> => {
    const current = getRunning()
    if (
      current &&
      !current.process.killed &&
      current.configUri === configUri.trim()
    ) {
      return current.socks
    }

    await stopRunning(current)
    setRunning(null)
    const next = await spawnXray(parsed.config, configUri.trim())
    setRunning(next)
    console.log(
      `[telegram-proxy] SOCKS5 ready at ${next.socks.url} → ${parsed.config.address}:${parsed.config.port}`
    )
    return next.socks
  }

  const existingLock = getStartLock()
  if (existingLock) await existingLock.catch(() => undefined)
  const promise = run()
  setStartLock(
    promise.finally(() => {
      setStartLock(null)
    })
  )
  return promise
}

/** Start Xray from config, probe Telegram over SOCKS5, keep process alive. */
export async function testAndActivateVlessProxy(
  configUri: string
): Promise<ProxyTestResult> {
  const parsed = parseVlessUri(configUri)
  if (!parsed.ok) {
    return { ok: false, error: parsed.error }
  }

  try {
    const socks = await ensureTelegramProxy(configUri)
    const probe = await httpsGetViaSocks('https://api.telegram.org', socks)
    if (probe.status < 200 || probe.status >= 500) {
      await stopTelegramProxy()
      return {
        ok: false,
        error: `پاسخ غیرمنتظره از تلگرام (HTTP ${probe.status})`,
      }
    }
    return {
      ok: true,
      socks,
      latencyMs: probe.latencyMs,
      remark: parsed.config.remark,
    }
  } catch (error) {
    await stopTelegramProxy().catch(() => undefined)
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'تست پروکسی ناموفق بود.',
    }
  }
}

/**
 * Validate + temporarily run Xray and probe Telegram without replacing
 * the long-lived proxy unless activation is requested via keepAlive.
 */
export async function testVlessProxy(
  configUri: string,
  options?: { keepAlive?: boolean }
): Promise<ProxyTestResult> {
  if (options?.keepAlive) {
    return testAndActivateVlessProxy(configUri)
  }

  const parsed = parseVlessUri(configUri)
  if (!parsed.ok) {
    return { ok: false, error: parsed.error }
  }

  // Ephemeral probe only when keepAlive is false — prefer keepAlive for ops.
  let instance: RunningProxy | null = null
  try {
    const current = getRunning()
    if (
      current &&
      !current.process.killed &&
      current.configUri === configUri.trim()
    ) {
      const probe = await httpsGetViaSocks(
        'https://api.telegram.org',
        current.socks
      )
      if (probe.status < 200 || probe.status >= 500) {
        return {
          ok: false,
          error: `پاسخ غیرمنتظره از تلگرام (HTTP ${probe.status})`,
        }
      }
      return {
        ok: true,
        socks: current.socks,
        latencyMs: probe.latencyMs,
        remark: parsed.config.remark,
      }
    }

    instance = await spawnXray(parsed.config, configUri.trim())
    const probe = await httpsGetViaSocks(
      'https://api.telegram.org',
      instance.socks
    )
    const socks = instance.socks
    await stopRunning(instance)
    instance = null

    if (probe.status < 200 || probe.status >= 500) {
      return {
        ok: false,
        error: `پاسخ غیرمنتظره از تلگرام (HTTP ${probe.status})`,
      }
    }

    return {
      ok: true,
      socks,
      latencyMs: probe.latencyMs,
      remark: parsed.config.remark,
    }
  } catch (error) {
    if (instance) await stopRunning(instance).catch(() => undefined)
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'تست پروکسی ناموفق بود.',
    }
  }
}

export function createSocksAgent(
  socks: SocksEndpoint | null | undefined
): SocksProxyAgent | undefined {
  if (!socks) return undefined
  return new SocksProxyAgent(socks.url)
}
