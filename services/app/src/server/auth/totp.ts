import { SignJWT, jwtVerify } from 'jose'
import QRCode from 'qrcode'
import { decryptSecret, encryptSecret } from '../crypto'
import { query } from '../db'
import type { User } from '../types'
import {
  buildOtpAuthUrl,
  generateTotpSecret,
  verifyTotpCode,
} from './totp-crypto'

const TOTP_LOGIN_TTL_SECONDS = 5 * 60
const TOTP_ISSUER = 'وکیل‌آ'

export type TotpStatus = {
  enabled: boolean
  confirmedAt: string | null
}

export type TotpSetupResult = {
  secret: string
  otpauthUrl: string
  qrDataUrl: string
}

export type TotpLoginChallengeClaims = {
  userId: string
  needsName: boolean
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET is missing or too short')
  }
  return new TextEncoder().encode(secret)
}

function decryptOrNull(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    return decryptSecret(value)
  } catch {
    return null
  }
}

export async function getTotpStatus(userId: string): Promise<TotpStatus> {
  const { rows } = await query<{
    totp_enabled: boolean
    totp_confirmed_at: Date | null
  }>(
    `SELECT totp_enabled, totp_confirmed_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  )

  const row = rows[0]
  if (!row) throw new Error('کاربر یافت نشد.')

  return {
    enabled: row.totp_enabled,
    confirmedAt: row.totp_confirmed_at
      ? new Date(row.totp_confirmed_at).toISOString()
      : null,
  }
}

export async function startTotpSetup(user: User): Promise<TotpSetupResult> {
  const secret = generateTotpSecret()
  const encrypted = encryptSecret(secret)

  await query(
    `UPDATE users
     SET totp_pending_secret_encrypted = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [user.id, encrypted]
  )

  const accountName = user.phone || user.email || user.id
  const otpauthUrl = buildOtpAuthUrl({
    secret,
    accountName,
    issuer: TOTP_ISSUER,
  })
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 220,
    color: { dark: '#0f172a', light: '#ffffff' },
  })

  return { secret, otpauthUrl, qrDataUrl }
}

export async function confirmTotpSetup(
  userId: string,
  code: string
): Promise<TotpStatus> {
  const { rows } = await query<{
    totp_pending_secret_encrypted: string | null
    totp_enabled: boolean
  }>(
    `SELECT totp_pending_secret_encrypted, totp_enabled
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  )

  const row = rows[0]
  if (!row) throw new Error('کاربر یافت نشد.')

  const pending = decryptOrNull(row.totp_pending_secret_encrypted)
  if (!pending) {
    throw new Error('ابتدا فعال‌سازی را شروع کنید.')
  }

  if (!verifyTotpCode(pending, code)) {
    throw new Error('کد تأیید نادرست است.')
  }

  await query(
    `UPDATE users
     SET totp_secret_encrypted = totp_pending_secret_encrypted,
         totp_pending_secret_encrypted = NULL,
         totp_enabled = TRUE,
         totp_confirmed_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  )

  return getTotpStatus(userId)
}

export async function cancelTotpSetup(userId: string): Promise<void> {
  await query(
    `UPDATE users
     SET totp_pending_secret_encrypted = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  )
}

export async function disableTotp(
  userId: string,
  code: string
): Promise<TotpStatus> {
  const { rows } = await query<{
    totp_enabled: boolean
    totp_secret_encrypted: string | null
  }>(
    `SELECT totp_enabled, totp_secret_encrypted
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  )

  const row = rows[0]
  if (!row) throw new Error('کاربر یافت نشد.')
  if (!row.totp_enabled) {
    throw new Error('ورود دو مرحله‌ای فعال نیست.')
  }

  const secret = decryptOrNull(row.totp_secret_encrypted)
  if (!secret || !verifyTotpCode(secret, code)) {
    throw new Error('کد تأیید نادرست است.')
  }

  await query(
    `UPDATE users
     SET totp_enabled = FALSE,
         totp_secret_encrypted = NULL,
         totp_pending_secret_encrypted = NULL,
         totp_confirmed_at = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  )

  return getTotpStatus(userId)
}

export async function isTotpEnabledForUser(userId: string): Promise<boolean> {
  const { rows } = await query<{ totp_enabled: boolean }>(
    `SELECT totp_enabled FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  )
  return Boolean(rows[0]?.totp_enabled)
}

export async function verifyUserTotp(
  userId: string,
  code: string
): Promise<boolean> {
  const { rows } = await query<{
    totp_enabled: boolean
    totp_secret_encrypted: string | null
  }>(
    `SELECT totp_enabled, totp_secret_encrypted
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  )

  const row = rows[0]
  if (!row?.totp_enabled) return false
  const secret = decryptOrNull(row.totp_secret_encrypted)
  if (!secret) return false
  return verifyTotpCode(secret, code)
}

export async function signTotpLoginChallenge(input: {
  userId: string
  needsName: boolean
}): Promise<string> {
  const expiresAt = new Date(Date.now() + TOTP_LOGIN_TTL_SECONDS * 1000)
  return new SignJWT({
    purpose: 'totp_login',
    needsName: input.needsName,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecretKey())
}

export async function verifyTotpLoginChallenge(
  token: string
): Promise<TotpLoginChallengeClaims | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    })
    if (payload.purpose !== 'totp_login') return null
    if (typeof payload.sub !== 'string') return null
    return {
      userId: payload.sub,
      needsName: Boolean(payload.needsName),
    }
  } catch {
    return null
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT id, phone, name, email, role, avatar_url, title, specialty,
            bar_number, is_active, created_at, updated_at,
            totp_enabled, totp_secret_encrypted, totp_pending_secret_encrypted,
            totp_confirmed_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  )
  return rows[0] ?? null
}
