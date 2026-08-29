import { query } from '@/server/db'
import { decryptSecret } from '@/server/crypto'
import { ensureTelegramProxy, type SocksEndpoint } from './proxy-manager'

/**
 * Load stored VLESS URI and ensure the process-wide SOCKS5 is up.
 * Used by Bot API calls / poller so traffic never goes direct to Telegram.
 */
export async function ensureTelegramProxyFromDb(): Promise<SocksEndpoint> {
  const { rows } = await query<{ proxy_config_cipher: string | null }>(
    `SELECT proxy_config_cipher FROM messenger_platform_settings
     WHERE platform = 'telegram' LIMIT 1`
  )
  const cipher = rows[0]?.proxy_config_cipher
  if (!cipher) {
    throw new Error(
      'کانفیگ V2Ray برای تلگرام ذخیره نشده است. ابتدا کانفیگ را پینگ و ذخیره کنید.'
    )
  }

  let config: string
  try {
    config = decryptSecret(cipher)
  } catch {
    throw new Error('کانفیگ V2Ray ذخیره‌شده قابل خواندن نیست. دوباره ذخیره کنید.')
  }

  return ensureTelegramProxy(config)
}
