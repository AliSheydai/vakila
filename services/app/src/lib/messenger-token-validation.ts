import type { MessengerPlatform } from '@/features/settings-admin/types'

/** Telegram / Bale Bot API style: `{bot_id}:{secret}` */
const TELEGRAM_BALE_TOKEN = /^\d{5,12}:[A-Za-z0-9_-]{20,64}$/

/** Bale sometimes issues a single opaque string without a colon. */
const BALE_OPAQUE_TOKEN = /^[A-Za-z0-9_-]{32,128}$/

/** Rubika token is used as a URL path segment (no slashes or spaces). */
const RUBIKA_TOKEN = /^[A-Za-z0-9_-]{16,128}$/

export const TOKEN_FORMAT_HINTS: Record<MessengerPlatform, string> = {
  telegram: 'مثال: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
  bale: 'مثال: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
  rubika: 'مثال: BotFatherTokenFromRubikaPanel',
}

export const TOKEN_FORMAT_DESCRIPTIONS: Record<MessengerPlatform, string> = {
  telegram:
    'شناسه عددی بات، دو‌نقطه، و رشتهٔ مخفی (حروف لاتین، اعداد، _ و -).',
  bale:
    'شناسه عددی بات و رشتهٔ مخفی (مثل تلگرام) یا یک رشتهٔ یک‌تکه از BotFather.',
  rubika:
    'رشتهٔ توکن دریافتی از Bot Father روبیکا؛ ۱۶ تا ۱۲۸ کاراکتر لاتین.',
}

export type TokenValidationResult =
  | { valid: true }
  | { valid: false; message: string }

export function validateMessengerToken(
  platform: MessengerPlatform,
  token: string
): TokenValidationResult {
  const trimmed = token.trim()

  if (!trimmed) {
    return { valid: false, message: 'توکن را وارد کنید.' }
  }

  if (platform === 'telegram') {
    if (!TELEGRAM_BALE_TOKEN.test(trimmed)) {
      return {
        valid: false,
        message:
          'فرمت توکن تلگرام نامعتبر است. باید به شکل «شناسه‌بات:رشتهٔ مخفی» باشد.',
      }
    }
    return { valid: true }
  }

  if (platform === 'bale') {
    if (
      !TELEGRAM_BALE_TOKEN.test(trimmed) &&
      !BALE_OPAQUE_TOKEN.test(trimmed)
    ) {
      return {
        valid: false,
        message:
          'فرمت توکن بله نامعتبر است. باید شبیه توکن تلگرام یا یک رشتهٔ ۳۲+ کاراکتری باشد.',
      }
    }
    return { valid: true }
  }

  if (!RUBIKA_TOKEN.test(trimmed)) {
    return {
      valid: false,
      message:
        'فرمت توکن روبیکا نامعتبر است. فقط حروف لاتین، اعداد، خط تیره و زیرخط مجاز است.',
    }
  }

  return { valid: true }
}

export function isMessengerTokenFormatValid(
  platform: MessengerPlatform,
  token: string
): boolean {
  return validateMessengerToken(platform, token).valid
}
