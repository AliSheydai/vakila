/**
 * Bot API webhook URLs must be public HTTPS (localhost, private IPs, plain HTTP
 * are rejected). Shared by Telegram and Bale.
 */
export function canUseBotWebhook(appUrl: string): boolean {
  try {
    const url = new URL(appUrl)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local')
    ) {
      return false
    }
    // Private IPv4 ranges
    if (/^10\./.test(host)) return false
    if (/^192\.168\./.test(host)) return false
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false
    return true
  } catch {
    return false
  }
}

/** @deprecated Prefer canUseBotWebhook */
export function canUseTelegramWebhook(appUrl: string): boolean {
  return canUseBotWebhook(appUrl)
}
