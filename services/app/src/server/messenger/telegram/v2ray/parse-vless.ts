export type VlessNetwork = 'tcp' | 'ws' | 'grpc' | 'httpupgrade' | 'xhttp' | 'h2' | 'http'

export type ParsedVlessConfig = {
  protocol: 'vless'
  id: string
  address: string
  port: number
  encryption: string
  flow: string
  network: VlessNetwork
  security: 'none' | 'tls' | 'reality'
  sni: string
  fingerprint: string
  publicKey: string
  shortId: string
  spiderX: string
  path: string
  host: string
  alpn: string[]
  serviceName: string
  mode: string
  headerType: string
  remark: string
}

export type ParseVlessResult =
  | { ok: true; config: ParsedVlessConfig }
  | { ok: false; error: string }

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function firstParam(params: URLSearchParams, keys: string[]): string {
  for (const key of keys) {
    const value = params.get(key)
    if (value != null && value !== '') return value
  }
  return ''
}

function normalizeNetwork(raw: string): VlessNetwork {
  const value = raw.toLowerCase() || 'tcp'
  if (
    value === 'tcp' ||
    value === 'ws' ||
    value === 'grpc' ||
    value === 'httpupgrade' ||
    value === 'xhttp' ||
    value === 'h2' ||
    value === 'http'
  ) {
    return value
  }
  return 'tcp'
}

function normalizeSecurity(raw: string): 'none' | 'tls' | 'reality' {
  const value = raw.toLowerCase()
  if (value === 'tls' || value === 'reality') return value
  return 'none'
}

/**
 * Parse a VLESS share link (`vless://…`).
 * Invalid examples like `vless://idjisajdioj` are rejected with a clear error.
 */
export function parseVlessUri(input: string): ParseVlessResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { ok: false, error: 'لینک کانفیگ خالی است.' }
  }

  if (!/^vless:\/\//i.test(trimmed)) {
    return {
      ok: false,
      error: 'فقط لینک‌های vless:// پشتیبانی می‌شوند.',
    }
  }

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return { ok: false, error: 'فرمت لینک کانفیگ نامعتبر است.' }
  }

  if (url.protocol.toLowerCase() !== 'vless:') {
    return { ok: false, error: 'فقط لینک‌های vless:// پشتیبانی می‌شوند.' }
  }

  const id = decodeURIComponent(url.username || '')
  if (!id) {
    return {
      ok: false,
      error:
        'شناسه (UUID) در لینک یافت نشد. قالب صحیح: vless://uuid@host:port?...',
    }
  }

  if (!UUID_RE.test(id)) {
    return {
      ok: false,
      error: 'شناسه VLESS باید یک UUID معتبر باشد.',
    }
  }

  const address = url.hostname
  if (!address) {
    return {
      ok: false,
      error:
        'آدرس سرور (host) در لینک یافت نشد. قالب صحیح: vless://uuid@host:port?...',
    }
  }

  const port = Number(url.port)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return {
      ok: false,
      error: 'پورت سرور نامعتبر است (باید عددی بین ۱ تا ۶۵۵۳۵ باشد).',
    }
  }

  const params = url.searchParams
  const network = normalizeNetwork(firstParam(params, ['type', 'network']))
  const security = normalizeSecurity(
    firstParam(params, ['security', 'sec']) || 'none'
  )
  const alpnRaw = firstParam(params, ['alpn'])
  const alpn = alpnRaw
    ? alpnRaw
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : []

  return {
    ok: true,
    config: {
      protocol: 'vless',
      id,
      address,
      port,
      encryption: firstParam(params, ['encryption']) || 'none',
      flow: firstParam(params, ['flow']),
      network,
      security,
      sni: firstParam(params, ['sni', 'serverName', 'peer']),
      fingerprint: firstParam(params, ['fp', 'fingerprint']) || 'chrome',
      publicKey: firstParam(params, ['pbk', 'publicKey']),
      shortId: firstParam(params, ['sid', 'shortId']),
      spiderX: firstParam(params, ['spx', 'spiderX']) || '',
      path: firstParam(params, ['path']) || '/',
      host: firstParam(params, ['host', 'authority']),
      alpn,
      serviceName: firstParam(params, ['serviceName', 'servicename']),
      mode: firstParam(params, ['mode']),
      headerType: firstParam(params, ['headerType', 'header']),
      remark: decodeURIComponent(url.hash.replace(/^#/, '')) || address,
    },
  }
}

export function proxyConfigHint(uri: string): string {
  const parsed = parseVlessUri(uri)
  if (!parsed.ok) return '••••'
  return `${parsed.config.address}:${parsed.config.port}`
}
