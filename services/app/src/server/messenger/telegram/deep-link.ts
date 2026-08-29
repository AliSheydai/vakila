import { createHmac, timingSafeEqual } from 'node:crypto'
import type { BotApiPlatform } from '@/server/messenger/bot-platforms'
import { getEnv } from '@/server/env'

/** Bot start payload: A-Z a-z 0-9 _ - max 64 chars */
const PAYLOAD_TTL_SECONDS = 60 * 60 * 24 // 24h — reusable while browsing dashboard

function hmacPrefix(
  platform: BotApiPlatform,
  message: string,
  bytes = 8
): string {
  // Keep legacy `tg-deeplink:` so existing dashboard Telegram links stay valid.
  const namespace = platform === 'telegram' ? 'tg-deeplink' : `${platform}-deeplink`
  return createHmac('sha256', getEnv().SESSION_SECRET)
    .update(`${namespace}:${message}`, 'utf8')
    .digest('base64url')
    .slice(0, bytes)
}

/**
 * Build a signed start payload bound to user id (not phone — avoids leaking PII).
 * Format: `{uuid32}{expBase36}_{sig}` — fits Telegram/Bale 64-char limit.
 */
export function createBotStartPayload(
  platform: BotApiPlatform,
  userId: string,
  ttlSeconds = PAYLOAD_TTL_SECONDS
): string {
  const id = userId.replace(/-/g, '').toLowerCase()
  if (!/^[0-9a-f]{32}$/.test(id)) {
    throw new Error('شناسه کاربر نامعتبر است.')
  }
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const expPart = exp.toString(36)
  const sig = hmacPrefix(platform, `${id}.${exp}`)
  const payload = `${id}${expPart}_${sig}`
  if (payload.length > 64) {
    throw new Error('توکن ورود بات بیش از حد طولانی است.')
  }
  return payload
}

export function verifyBotStartPayload(
  platform: BotApiPlatform,
  payload: string
): string | null {
  const trimmed = payload.trim()
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(trimmed)) return null

  const underscore = trimmed.lastIndexOf('_')
  if (underscore < 33) return null

  const body = trimmed.slice(0, underscore)
  const sig = trimmed.slice(underscore + 1)
  if (!sig) return null

  const id = body.slice(0, 32)
  const expPart = body.slice(32)
  if (!/^[0-9a-f]{32}$/.test(id) || !expPart) return null

  const exp = Number.parseInt(expPart, 36)
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null

  const expected = hmacPrefix(platform, `${id}.${exp}`)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
}

export function buildBotDeepLink(
  platform: BotApiPlatform,
  botUsername: string,
  startPayload: string
): string {
  const username = botUsername.replace(/^@/, '')
  if (platform === 'bale') {
    return `https://ble.ir/${username}?start=${encodeURIComponent(startPayload)}`
  }
  return `https://t.me/${username}?start=${encodeURIComponent(startPayload)}`
}

export function createTelegramStartPayload(
  userId: string,
  ttlSeconds = PAYLOAD_TTL_SECONDS
): string {
  return createBotStartPayload('telegram', userId, ttlSeconds)
}

export function verifyTelegramStartPayload(payload: string): string | null {
  return verifyBotStartPayload('telegram', payload)
}

export function buildTelegramDeepLink(
  botUsername: string,
  startPayload: string
): string {
  return buildBotDeepLink('telegram', botUsername, startPayload)
}

export function createBaleStartPayload(
  userId: string,
  ttlSeconds = PAYLOAD_TTL_SECONDS
): string {
  return createBotStartPayload('bale', userId, ttlSeconds)
}

export function verifyBaleStartPayload(payload: string): string | null {
  return verifyBotStartPayload('bale', payload)
}

export function buildBaleDeepLink(
  botUsername: string,
  startPayload: string
): string {
  return buildBotDeepLink('bale', botUsername, startPayload)
}
