import { createWriteStream } from 'node:fs'
import {
  access,
  chmod,
  mkdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises'
import { arch, platform } from 'node:os'
import { dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { Readable } from 'node:stream'

const execFileAsync = promisify(execFile)

/** Pinned Xray-core release used for local SOCKS5 inbound. */
export const XRAY_VERSION = '25.3.6'

function appRoot(): string {
  // Custom server and Next API routes run with cwd = services/app
  return process.cwd()
}

function xrayDir(): string {
  return join(appRoot(), '.xray')
}

function binaryName(): string {
  return platform() === 'win32' ? 'xray.exe' : 'xray'
}

export function defaultXrayBinaryPath(): string {
  return join(xrayDir(), binaryName())
}

type AssetInfo = {
  fileName: string
  url: string
}

function resolveAsset(): AssetInfo {
  const os = platform()
  const cpu = arch()

  let asset: string
  if (os === 'win32') {
    asset = cpu === 'arm64' ? 'Xray-windows-arm64-v8a.zip' : 'Xray-windows-64.zip'
  } else if (os === 'darwin') {
    asset =
      cpu === 'arm64' ? 'Xray-macos-arm64-v8a.zip' : 'Xray-macos-64.zip'
  } else if (os === 'linux') {
    if (cpu === 'arm64') asset = 'Xray-linux-arm64-v8a.zip'
    else if (cpu === 'arm') asset = 'Xray-linux-arm32-v7a.zip'
    else asset = 'Xray-linux-64.zip'
  } else {
    throw new Error(`سیستم‌عامل پشتیبانی‌نشده برای Xray: ${os}`)
  }

  return {
    fileName: asset,
    url: `https://github.com/XTLS/Xray-core/releases/download/v${XRAY_VERSION}/${asset}`,
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function downloadToFile(url: string, dest: string): Promise<void> {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'vakila-xray-bootstrap' },
  })
  if (!response.ok || !response.body) {
    throw new Error(`دانلود Xray ناموفق بود (HTTP ${response.status}).`)
  }
  await mkdir(dirname(dest), { recursive: true })
  const file = createWriteStream(dest)
  await pipeline(Readable.fromWeb(response.body as never), file)
}

async function extractZip(zipPath: string, destDir: string): Promise<void> {
  await mkdir(destDir, { recursive: true })
  if (platform() === 'win32') {
    await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`,
      ],
      { windowsHide: true }
    )
    return
  }

  await execFileAsync('unzip', ['-o', zipPath, '-d', destDir])
}

async function findExtractedBinary(dir: string): Promise<string | null> {
  const candidates = [
    join(dir, binaryName()),
    join(dir, 'xray'),
    join(dir, 'xray.exe'),
  ]
  for (const candidate of candidates) {
    if (await pathExists(candidate)) return candidate
  }
  return null
}

/**
 * Resolve an executable Xray binary:
 * 1) `XRAY_BIN` env
 * 2) cached `.xray/xray(.exe)`
 * 3) download pinned GitHub release into `.xray/`
 */
export async function ensureXrayBinary(): Promise<string> {
  const fromEnv = process.env.XRAY_BIN?.trim()
  if (fromEnv) {
    if (!(await pathExists(fromEnv))) {
      throw new Error(`XRAY_BIN تنظیم شده ولی فایل یافت نشد: ${fromEnv}`)
    }
    return fromEnv
  }

  const cached = defaultXrayBinaryPath()
  if (await pathExists(cached)) {
    return cached
  }

  const asset = resolveAsset()
  const dir = xrayDir()
  await mkdir(dir, { recursive: true })

  const zipPath = join(dir, asset.fileName)
  const extractDir = join(dir, 'extract')
  await rm(extractDir, { recursive: true, force: true })

  console.log(`[xray] downloading ${asset.url}`)
  await downloadToFile(asset.url, zipPath)
  await extractZip(zipPath, extractDir)

  const extracted = await findExtractedBinary(extractDir)
  if (!extracted) {
    throw new Error('پس از استخراج، باینری Xray یافت نشد.')
  }

  await rename(extracted, cached)
  if (platform() !== 'win32') {
    await chmod(cached, 0o755)
  }

  await writeFile(join(dir, 'VERSION'), `${XRAY_VERSION}\n`, 'utf8')
  await rm(extractDir, { recursive: true, force: true })
  await rm(zipPath, { force: true })

  return cached
}
