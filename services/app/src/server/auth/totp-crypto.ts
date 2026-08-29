import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const TOTP_PERIOD_SECONDS = 30
const TOTP_DIGITS = 6
const TOTP_WINDOW = 1

/** Generate a 160-bit Base32 secret suitable for authenticator apps. */
export function generateTotpSecret(): string {
  return encodeBase32(randomBytes(20))
}

export function buildOtpAuthUrl(input: {
  secret: string
  accountName: string
  issuer?: string
}): string {
  const issuer = input.issuer ?? 'وکیل‌آ'
  const label = encodeURIComponent(`${issuer}:${input.accountName}`)
  const params = new URLSearchParams({
    secret: input.secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  })
  return `otpauth://totp/${label}?${params.toString()}`
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const trimmed = code.trim()
  if (!/^\d{6}$/.test(trimmed)) return false

  let key: Buffer
  try {
    key = decodeBase32(secret)
  } catch {
    return false
  }

  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS)
  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset++) {
    const expected = hotp(key, counter + offset)
    if (timingSafeEqualStrings(expected, trimmed)) return true
  }
  return false
}

function hotp(key: Buffer, counter: number): string {
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac('sha1', key).update(buffer).digest()
  const offset = hmac[hmac.length - 1]! & 0x0f
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff)
  const otp = binary % 10 ** TOTP_DIGITS
  return String(otp).padStart(TOTP_DIGITS, '0')
}

function encodeBase32(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  return output
}

function decodeBase32(input: string): Buffer {
  const cleaned = input.replace(/=+$/, '').toUpperCase().replace(/\s+/g, '')
  let bits = 0
  let value = 0
  const bytes: number[] = []

  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1) {
      throw new Error('Invalid Base32 character')
    }
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }

  return Buffer.from(bytes)
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
