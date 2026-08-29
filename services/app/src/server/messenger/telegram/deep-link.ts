import { createHmac, timingSafeEqual } from 'node:crypto'
import type { MessengerPlatform } from '@/server/repositories/settings-repo'
import { getEnv } from '@/server/env'

/** Bot start payload: A-Z a-z 0-9 _ - max 64 chars */
const PAYLOAD_TTL_SECONDS = 60 * 60 * 24 // 24h — reusable while browsing dashboard
/** Fixed length of HMAC prefix; must not use lastIndexOf('_') because base64url may include `_`. */
const SIG_LEN = 8

function hmacPrefix(
  platform: MessengerPlatform,
  message: string,
  bytes = SIG_LEN
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
 * Format: `{uuid32}{expBase36}_{sig8}` — fits Telegram/Bale/Rubika 64-char limit.
 * Signature is always exactly SIG_LEN chars (may contain `_` / `-`).
 */
export function createBotStartPayload(
  platform: MessengerPlatform,
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

function normalizePayload(payload: string): string {
  let trimmed = payload.trim()
  try {
    trimmed = decodeURIComponent(trimmed)
  } catch {
    // already decoded
  }
  return trimmed.trim()
}

export function verifyBotStartPayload(
  platform: MessengerPlatform,
  payload: string
): string | null {
  const trimmed = normalizePayload(payload)
  // id(32) + exp(≥1) + _(1) + sig(SIG_LEN)
  if (
    trimmed.length < 32 + 1 + 1 + SIG_LEN ||
    trimmed.length > 64 ||
    !/^[A-Za-z0-9_-]+$/.test(trimmed)
  ) {
    return null
  }

  // Parse sig as fixed suffix — do not use lastIndexOf('_'); base64url sig may include `_`.
  const sepIndex = trimmed.length - SIG_LEN - 1
  if (trimmed[sepIndex] !== '_') return null

  const body = trimmed.slice(0, sepIndex)
  const sig = trimmed.slice(sepIndex + 1)
  if (sig.length !== SIG_LEN) return null

  const id = body.slice(0, 32)
  const expPart = body.slice(32)
  if (!/^[0-9a-f]{32}$/.test(id) || !expPart || !/^[0-9a-z]+$/i.test(expPart)) {
    return null
  }

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

/**
 * True when the stored bot handle can be used in a public deep link
 * (not a placeholder like id_123 or rubika_bot fallback).
 */
export function isPublicBotUsername(
  username: string | null | undefined
): boolean {
  if (!username) return false
  const cleaned = username.replace(/^@/, '').trim()
  if (!cleaned) return false
  if (/^id_\d+$/i.test(cleaned)) return false
  if (cleaned === 'rubika_bot') return false
  // Telegram/Bale/Rubika usernames are typically 5+ alphanumerics / underscore
  return /^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(cleaned)
}

export function extractUsernameFromShareUrl(shareUrl: string): string | null {
  try {
    const url = new URL(shareUrl)
    const segment = url.pathname.replace(/^\/+/, '').split('/')[0]
    if (!segment) return null
    return isPublicBotUsername(segment) ? segment : null
  } catch {
    const match = shareUrl.match(
      /(?:rubika\.ir|t\.me|ble\.ir)\/@?([A-Za-z][A-Za-z0-9_]{3,31})/i
    )
    return match?.[1] ?? null
  }
}

export function buildBotDeepLink(
  platform: MessengerPlatform,
  botUsername: string,
  startPayload: string,
  options?: { shareUrl?: string | null }
): string {
  const username = botUsername.replace(/^@/, '')
  // Payload is already URL-safe (A-Za-z0-9_-); avoid encoding so messengers
  // that echo the query string literally still verify.
  const payload = startPayload

  if (platform === 'bale') {
    return `https://ble.ir/${username}?start=${payload}`
  }
  if (platform === 'rubika') {
    // AuxData.start_id is filled when the user opens a link with `st` query param.
    const fromShare = options?.shareUrl
      ? options.shareUrl.replace(/[?#].*$/, '').replace(/\/$/, '')
      : null
    const base =
      fromShare && /rubika\.ir\//i.test(fromShare)
        ? fromShare
        : `https://rubika.ir/${username}`
    return `${base}?st=${payload}`
  }
  return `https://t.me/${username}?start=${payload}`
}

export function createRubikaStartPayload(
  userId: string,
  ttlSeconds = PAYLOAD_TTL_SECONDS
): string {
  return createBotStartPayload('rubika', userId, ttlSeconds)
}

export function verifyRubikaStartPayload(payload: string): string | null {
  return verifyBotStartPayload('rubika', payload)
}

export function buildRubikaDeepLink(
  botUsername: string,
  startPayload: string
): string {
  return buildBotDeepLink('rubika', botUsername, startPayload)
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
