import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { getEnv } from './env'

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

export function generateOtp(length: number): string {
  if (length < 1 || length > 10) {
    throw new Error('OTP length must be between 1 and 10')
  }
  const max = 10 ** length
  const n = randomBytes(4).readUInt32BE(0) % max
  return String(n).padStart(length, '0')
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

/** HMAC-SHA256 hex digest with SESSION_SECRET as pepper. */
export function hashToken(token: string): string {
  return createHmac('sha256', getEnv().SESSION_SECRET)
    .update(token, 'utf8')
    .digest('hex')
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'hex')
    const bufB = Buffer.from(b, 'hex')
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}
