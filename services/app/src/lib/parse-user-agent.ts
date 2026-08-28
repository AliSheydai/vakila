export type DeviceKind = 'desktop' | 'mobile' | 'tablet'

export type ParsedUserAgent = {
  browser: string
  device: string
  kind: DeviceKind
}

function detectKind(ua: string): DeviceKind {
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return 'tablet'
  if (/Mobile|iPhone|Android.*Mobile|Windows Phone/i.test(ua)) return 'mobile'
  return 'desktop'
}

function detectBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Edge'
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera'
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome'
  if (/Firefox\//i.test(ua)) return 'Firefox'
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari'
  if (/MSIE|Trident/i.test(ua)) return 'Internet Explorer'
  return 'مرورگر نامشخص'
}

function detectDevice(ua: string, kind: DeviceKind): string {
  if (/iPhone/i.test(ua)) return 'iPhone'
  if (/iPad/i.test(ua)) return 'iPad'
  if (/Android/i.test(ua)) return 'Android'
  if (/Windows NT/i.test(ua)) return 'Windows'
  if (/Mac OS X/i.test(ua) && kind !== 'mobile') return 'macOS'
  if (/Linux/i.test(ua)) return 'Linux'
  if (kind === 'mobile') return 'موبایل'
  if (kind === 'tablet') return 'تبلت'
  return 'رایانه'
}

export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua?.trim()) {
    return {
      browser: 'مرورگر نامشخص',
      device: 'دستگاه نامشخص',
      kind: 'desktop',
    }
  }

  const kind = detectKind(ua)
  return {
    browser: detectBrowser(ua),
    device: detectDevice(ua, kind),
    kind,
  }
}
