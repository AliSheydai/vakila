import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'
import { getEnv } from './env'

const AES_ALGORITHM = 'aes-256-gcm'
const AES_IV_LENGTH = 12
const AES_KEY_LENGTH = 32
const AES_SALT = 'vakila-bot-token-v1'

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

function deriveEncryptionKey(): Buffer {
  return scryptSync(getEnv().SESSION_SECRET, AES_SALT, AES_KEY_LENGTH)
}

/** AES-256-GCM encrypt for stored secrets (e.g. bot tokens). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(AES_IV_LENGTH)
  const key = deriveEncryptionKey()
  const cipher = createCipheriv(AES_ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

/** Decrypt a value produced by encryptSecret. */
export function decryptSecret(ciphertext: string): string {
  const [ivB64, tagB64, dataB64] = ciphertext.split(':')
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid ciphertext format')
  }
  const key = deriveEncryptionKey()
  const decipher = createDecipheriv(
    AES_ALGORITHM,
    key,
    Buffer.from(ivB64, 'base64')
  )
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

/** Mask a secret for display (last 4 chars visible). */
export function secretHint(secret: string): string {
  if (secret.length <= 4) return '••••'
  return `•••••••${secret.slice(-4)}`
}
