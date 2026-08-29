/**
 * Telegram-compatible Bot API platforms used by Vakila chatbots.
 * Rubika uses a different API and is not included here.
 */
export type BotApiPlatform = 'telegram' | 'bale'

export const BOT_API_PLATFORMS: readonly BotApiPlatform[] = [
  'telegram',
  'bale',
] as const

export function isBotApiPlatform(
  value: string
): value is BotApiPlatform {
  return value === 'telegram' || value === 'bale'
}

export function botApiBaseUrl(platform: BotApiPlatform): string {
  return platform === 'bale'
    ? 'https://tapi.bale.ai'
    : 'https://api.telegram.org'
}

export function botPlatformLabel(platform: BotApiPlatform): string {
  return platform === 'bale' ? 'بله' : 'تلگرام'
}

/** Public HTTPS webhook path (secret may be appended as query for Bale). */
export function botWebhookPath(platform: BotApiPlatform): string {
  return `/api/webhooks/${platform}`
}
