import { randomBytes, timingSafeEqual } from 'node:crypto'
import { query } from '../db'
import {
  decryptSecret,
  encryptSecret,
  secretHint,
} from '../crypto'
import { getEnv } from '../env'
import {
  deleteWebhook,
  getMe,
  setWebhook,
  TelegramApiError,
} from '../messenger/telegram/api'
import {
  clearBotEndpoints,
  getMe as getRubikaMe,
  RubikaApiError,
  updateBotEndpoints,
} from '../messenger/rubika/api'
import {
  type BotApiPlatform,
  botPlatformLabel,
  botWebhookPath,
  isBotApiPlatform,
} from '../messenger/bot-platforms'
import {
  ensureTelegramProxyFromDb,
  getActiveSocksEndpoint,
  isProxyRunning,
  parseVlessUri,
  proxyConfigHint,
  stopTelegramProxy,
  testAndActivateVlessProxy,
} from '../messenger/telegram/v2ray'
import {
  extractUsernameFromShareUrl,
  isPublicBotUsername,
} from '../messenger/telegram/deep-link'
import { RUBIKA_CHATBOT_ENABLED } from '../messenger/rubika/feature'
import { canUseBotWebhook } from '../messenger/telegram/webhook-url'

export type MessengerPlatform = 'telegram' | 'bale' | 'rubika'
export type ClientNotificationChannel = 'in_app' | 'sms' | 'chatbot'

export type MessengerProxyStatus = {
  configured: boolean
  hint: string | null
  running: boolean
  socksHost: string | null
  socksPort: number | null
}

export type MessengerTokenStatus = {
  platform: MessengerPlatform
  configured: boolean
  enabled: boolean
  hint: string | null
  botUsername: string | null
  webhookSetAt: string | null
  updatedAt: string | null
  /** Present for telegram only. */
  proxy?: MessengerProxyStatus
}

export type NotificationDeliverySettings = {
  clientChannel: ClientNotificationChannel
  clientChatbotPlatforms: MessengerPlatform[]
  updatedAt: string | null
}

export type UserNotificationPreferences = {
  channel: ClientNotificationChannel
  chatbotPlatforms: MessengerPlatform[]
  updatedAt: string | null
}

const PLATFORMS: MessengerPlatform[] = ['telegram', 'bale', 'rubika']
const PLATFORM_ORDER = new Map(
  PLATFORMS.map((platform, index) => [platform, index])
)

export function normalizeMessengerPlatforms(
  platforms: readonly MessengerPlatform[] | null | undefined
): MessengerPlatform[] {
  if (!platforms?.length) return []
  const unique = new Set<MessengerPlatform>()
  for (const platform of platforms) {
    if (!PLATFORM_ORDER.has(platform)) continue
    // Strip Rubika from notification prefs while demo-gated
    if (platform === 'rubika' && !RUBIKA_CHATBOT_ENABLED) continue
    unique.add(platform)
  }
  return [...unique].sort(
    (a, b) => (PLATFORM_ORDER.get(a) ?? 0) - (PLATFORM_ORDER.get(b) ?? 0)
  )
}

/**
 * node-pg often returns custom enum arrays as a Postgres literal string
 * like `{telegram,bale}` instead of a JS array. Coerce both shapes.
 */
export function coerceMessengerPlatforms(value: unknown): MessengerPlatform[] {
  if (value == null) return []

  if (Array.isArray(value)) {
    return normalizeMessengerPlatforms(
      value.filter(
        (item): item is MessengerPlatform =>
          typeof item === 'string' && PLATFORM_ORDER.has(item as MessengerPlatform)
      ) as MessengerPlatform[]
    )
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || trimmed === '{}') return []
    const inner =
      trimmed.startsWith('{') && trimmed.endsWith('}')
        ? trimmed.slice(1, -1)
        : trimmed
    if (!inner) return []
    const parts = inner
      .split(',')
      .map((part) => part.trim().replace(/^"(.*)"$/, '$1'))
      .filter(Boolean) as MessengerPlatform[]
    return normalizeMessengerPlatforms(parts)
  }

  return []
}

type TokenRow = {
  platform: MessengerPlatform
  token_cipher: string
  updated_at: Date | string
}

type PlatformSettingsRow = {
  platform: MessengerPlatform
  enabled: boolean
  webhook_secret_cipher: string | null
  bot_username: string | null
  webhook_set_at: Date | string | null
  proxy_config_cipher: string | null
  updated_at: Date | string
}

function buildProxyStatus(
  cipher: string | null | undefined
): MessengerProxyStatus {
  if (!cipher) {
    return {
      configured: false,
      hint: null,
      running: false,
      socksHost: null,
      socksPort: null,
    }
  }

  let hint: string | null = '••••'
  try {
    hint = proxyConfigHint(decryptSecret(cipher))
  } catch {
    hint = '••••'
  }

  const socks = getActiveSocksEndpoint()
  const running = isProxyRunning()
  return {
    configured: true,
    hint,
    running,
    socksHost: running ? (socks?.host ?? null) : null,
    socksPort: running ? (socks?.port ?? null) : null,
  }
}

type DeliveryRow = {
  client_channel: ClientNotificationChannel
  client_chatbot_platforms: MessengerPlatform[] | string | null
  updated_at: Date | string
}

type UserPreferencesRow = {
  channel: ClientNotificationChannel
  chatbot_platforms: MessengerPlatform[] | string | null
  updated_at: Date | string
}

function toIso(value: Date | string | null): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : String(value)
}

function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex')
}

export async function getMessengerTokensStatus(): Promise<
  MessengerTokenStatus[]
> {
  const [{ rows: tokenRows }, { rows: settingsRows }] = await Promise.all([
    query<TokenRow>(
      `SELECT platform, token_cipher, updated_at FROM messenger_bot_tokens`
    ),
    query<PlatformSettingsRow>(
      `SELECT platform, enabled, webhook_secret_cipher, bot_username,
              webhook_set_at, proxy_config_cipher, updated_at
       FROM messenger_platform_settings`
    ),
  ])

  const tokensByPlatform = new Map(
    tokenRows.map((row) => [row.platform, row])
  )
  const settingsByPlatform = new Map(
    settingsRows.map((row) => [row.platform, row])
  )

  return PLATFORMS.map((platform) => {
    const row = tokensByPlatform.get(platform)
    const settings = settingsByPlatform.get(platform)
    const proxy =
      platform === 'telegram'
        ? buildProxyStatus(settings?.proxy_config_cipher)
        : undefined

    if (!row) {
      return {
        platform,
        configured: false,
        enabled: settings?.enabled ?? false,
        hint: null,
        botUsername: settings?.bot_username ?? null,
        webhookSetAt: settings ? toIso(settings.webhook_set_at) : null,
        updatedAt: settings ? toIso(settings.updated_at) : null,
        proxy,
      }
    }

    let hint: string | null = null
    try {
      const token = decryptSecret(row.token_cipher)
      hint = secretHint(token)
    } catch {
      hint = '••••'
    }

    return {
      platform,
      configured: true,
      enabled: settings?.enabled ?? false,
      hint,
      botUsername: settings?.bot_username ?? null,
      webhookSetAt: settings ? toIso(settings.webhook_set_at) : null,
      updatedAt: toIso(row.updated_at),
      proxy,
    }
  })
}

export async function getDecryptedTelegramProxyConfig(): Promise<string | null> {
  const { rows } = await query<{ proxy_config_cipher: string | null }>(
    `SELECT proxy_config_cipher FROM messenger_platform_settings
     WHERE platform = 'telegram' LIMIT 1`
  )
  const cipher = rows[0]?.proxy_config_cipher
  if (!cipher) return null
  try {
    return decryptSecret(cipher)
  } catch {
    return null
  }
}

export async function upsertTelegramProxyConfig(
  configUri: string,
  userId: string,
  options?: { activate?: boolean }
): Promise<MessengerTokenStatus> {
  const trimmed = configUri.trim()
  const parsed = parseVlessUri(trimmed)
  if (!parsed.ok) {
    throw new Error(parsed.error)
  }

  if (options?.activate !== false) {
    const test = await testAndActivateVlessProxy(trimmed)
    if (!test.ok) {
      throw new Error(test.error ?? 'تست کانفیگ V2Ray ناموفق بود.')
    }
  }

  const cipher = encryptSecret(trimmed)
  await query(
    `INSERT INTO messenger_platform_settings (platform, enabled, proxy_config_cipher, updated_by)
     VALUES ('telegram', FALSE, $1, $2)
     ON CONFLICT (platform) DO UPDATE SET
       proxy_config_cipher = EXCLUDED.proxy_config_cipher,
       updated_at = NOW(),
       updated_by = EXCLUDED.updated_by`,
    [cipher, userId]
  )

  const statuses = await getMessengerTokensStatus()
  const status = statuses.find((s) => s.platform === 'telegram')
  if (!status) {
    throw new Error('Failed to save telegram proxy config')
  }
  return status
}

export async function deleteTelegramProxyConfig(
  userId: string
): Promise<{
  messenger: MessengerTokenStatus
  notificationDelivery?: NotificationDeliverySettings
}> {
  // Telegram bot cannot stay enabled without a reachable proxy.
  const before = (await getMessengerTokensStatus()).find(
    (s) => s.platform === 'telegram'
  )
  let notificationDelivery: NotificationDeliverySettings | undefined
  if (before?.enabled) {
    const disabled = await setMessengerEnabled('telegram', false, userId, {
      skipTeardown: false,
    })
    notificationDelivery = disabled.notificationDelivery
  }

  await stopTelegramProxy().catch(() => undefined)
  await query(
    `INSERT INTO messenger_platform_settings (platform, enabled, proxy_config_cipher, updated_by)
     VALUES ('telegram', FALSE, NULL, $1)
     ON CONFLICT (platform) DO UPDATE SET
       enabled = FALSE,
       proxy_config_cipher = NULL,
       updated_at = NOW(),
       updated_by = EXCLUDED.updated_by`,
    [userId]
  )

  const statuses = await getMessengerTokensStatus()
  const messenger = statuses.find((s) => s.platform === 'telegram')
  if (!messenger) {
    throw new Error('Failed to delete telegram proxy config')
  }
  return { messenger, notificationDelivery }
}

/** Restore local SOCKS5 from DB on process boot (if a config is stored). */
export async function startTelegramProxyFromSettings(): Promise<void> {
  try {
    const socks = await ensureTelegramProxyFromDb()
    console.log(
      `[telegram-proxy] boot SOCKS5 ready at ${socks.host}:${socks.port}`
    )
  } catch (error) {
    // No config yet is fine; real failures should be visible.
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('ذخیره نشده')) return
    console.error('[telegram-proxy] failed to start from settings', error)
  }
}

export async function isMessengerTokenConfigured(
  platform: MessengerPlatform
): Promise<boolean> {
  const { rows } = await query<{ platform: MessengerPlatform }>(
    `SELECT platform FROM messenger_bot_tokens WHERE platform = $1 LIMIT 1`,
    [platform]
  )
  return rows.length > 0
}

export async function isMessengerReady(
  platform: MessengerPlatform
): Promise<boolean> {
  // Rubika temporarily off for site demo
  if (platform === 'rubika' && !RUBIKA_CHATBOT_ENABLED) return false
  const statuses = await getMessengerTokensStatus()
  const status = statuses.find((s) => s.platform === platform)
  return Boolean(status?.configured && status.enabled)
}

export async function getDecryptedMessengerToken(
  platform: MessengerPlatform
): Promise<string | null> {
  const { rows } = await query<TokenRow>(
    `SELECT platform, token_cipher, updated_at FROM messenger_bot_tokens
     WHERE platform = $1 LIMIT 1`,
    [platform]
  )
  const row = rows[0]
  if (!row) return null
  try {
    return decryptSecret(row.token_cipher)
  } catch {
    return null
  }
}

export async function getWebhookSecret(
  platform: MessengerPlatform
): Promise<string | null> {
  const { rows } = await query<{ webhook_secret_cipher: string | null }>(
    `SELECT webhook_secret_cipher FROM messenger_platform_settings
     WHERE platform = $1 LIMIT 1`,
    [platform]
  )
  const cipher = rows[0]?.webhook_secret_cipher
  if (!cipher) return null
  try {
    return decryptSecret(cipher)
  } catch {
    return null
  }
}

export function verifyWebhookSecret(
  expected: string | null,
  provided: string | null
): boolean {
  if (!expected || !provided) return false
  try {
    const a = Buffer.from(expected, 'utf8')
    const b = Buffer.from(provided, 'utf8')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export async function upsertMessengerToken(
  platform: MessengerPlatform,
  token: string,
  userId: string
): Promise<MessengerTokenStatus> {
  if (platform === 'telegram') {
    await requireWorkingTelegramProxy('token')
  }

  const cipher = encryptSecret(token.trim())

  await query(
    `INSERT INTO messenger_bot_tokens (platform, token_cipher, updated_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (platform) DO UPDATE SET
       token_cipher = EXCLUDED.token_cipher,
       updated_at = NOW(),
       updated_by = EXCLUDED.updated_by`,
    [platform, cipher, userId]
  )

  const statuses = await getMessengerTokensStatus()
  const status = statuses.find((s) => s.platform === platform)
  if (!status) {
    throw new Error('Failed to save messenger token')
  }
  return status
}

async function clearWebhookMetadata(
  platform: MessengerPlatform,
  userId: string
): Promise<void> {
  await query(
    `UPDATE messenger_platform_settings
     SET webhook_secret_cipher = NULL,
         bot_username = NULL,
         webhook_set_at = NULL,
         updated_at = NOW(),
         updated_by = $2
     WHERE platform = $1`,
    [platform, userId]
  )
}

async function teardownBotWebhook(
  platform: BotApiPlatform,
  userId: string
): Promise<void> {
  const token = await getDecryptedMessengerToken(platform)
  if (token) {
    try {
      await deleteWebhook(platform, token)
    } catch (error) {
      console.error(`[messenger] deleteWebhook(${platform}) failed`, error)
    }
  }
  await clearWebhookMetadata(platform, userId)
}

/**
 * Telegram Bot API is only reachable via the stored V2Ray config.
 * Config must exist and successfully start + ping before token save / enable.
 */
async function requireWorkingTelegramProxy(
  purpose: 'token' | 'enable' = 'enable'
): Promise<void> {
  const config = await getDecryptedTelegramProxyConfig()
  if (!config) {
    throw new Error(
      purpose === 'token'
        ? 'برای ثبت توکن تلگرام، ابتدا کانفیگ V2Ray را وارد کنید، پینگ بگیرید و ذخیره کنید.'
        : 'برای فعال‌سازی چت‌بات تلگرام، ابتدا کانفیگ V2Ray را وارد کنید، پینگ بگیرید و ذخیره کنید.'
    )
  }

  const test = await testAndActivateVlessProxy(config)
  if (!test.ok) {
    throw new Error(
      test.error ??
        'کانفیگ V2Ray پینگ نداد. کانفیگ وصل‌شونده وارد کنید و دوباره تست کنید.'
    )
  }
}

async function activateBotWebhook(
  platform: BotApiPlatform,
  userId: string
): Promise<{
  botUsername: string
  mode: 'webhook' | 'polling'
}> {
  const label = botPlatformLabel(platform)
  const token = await getDecryptedMessengerToken(platform)
  if (!token) {
    throw new Error(`ابتدا توکن ${label} را ذخیره کنید.`)
  }

  // V2Ray/SOCKS is Telegram-only — Bale is reached directly.
  if (platform === 'telegram') {
    await requireWorkingTelegramProxy('enable')
  }

  let botUsername: string
  try {
    const me = await getMe(platform, token)
    if (!me.username) {
      throw new Error(
        `بات ${label} باید username عمومی داشته باشد تا لینک ورود از داشبورد کار کند. در BotFather یک username تنظیم کنید.`
      )
    }
    botUsername = me.username.replace(/^@/, '')
  } catch (error) {
    if (error instanceof TelegramApiError) {
      throw new Error(
        `توکن ${label} نامعتبر است یا به Bot API دسترسی نیست: ${error.description}`
      )
    }
    if (error instanceof Error && error.message.includes('username')) {
      throw error
    }
    throw new Error(`ارتباط با ${label} برقرار نشد. دوباره تلاش کنید.`)
  }

  const env = getEnv()
  const useWebhook = canUseBotWebhook(env.APP_URL)

  if (!useWebhook) {
    try {
      await deleteWebhook(platform, token)
    } catch (error) {
      console.error(
        `[messenger] deleteWebhook before polling (${platform}) failed`,
        error
      )
    }

    await query(
      `INSERT INTO messenger_platform_settings (
         platform, enabled, webhook_secret_cipher, bot_username, webhook_set_at, updated_by
       ) VALUES ($1, TRUE, NULL, $2, NULL, $3)
       ON CONFLICT (platform) DO UPDATE SET
         enabled = TRUE,
         webhook_secret_cipher = NULL,
         bot_username = EXCLUDED.bot_username,
         webhook_set_at = NULL,
         updated_at = NOW(),
         updated_by = EXCLUDED.updated_by`,
      [platform, botUsername, userId]
    )

    console.log(
      `[messenger] ${label} bot @${botUsername} enabled in polling mode (APP_URL=${env.APP_URL} is not public HTTPS)`
    )
    return { botUsername, mode: 'polling' }
  }

  const secret = generateWebhookSecret()
  const base = env.APP_URL.replace(/\/$/, '')
  // Bale has no documented secret_token header — put secret in the webhook URL.
  const webhookUrl =
    platform === 'bale'
      ? `${base}${botWebhookPath(platform)}?secret=${encodeURIComponent(secret)}`
      : `${base}${botWebhookPath(platform)}`

  try {
    await setWebhook(platform, token, {
      url: webhookUrl,
      secretToken: platform === 'telegram' ? secret : undefined,
      allowedUpdates: ['message', 'callback_query'],
      dropPendingUpdates: true,
    })
  } catch (error) {
    if (error instanceof TelegramApiError) {
      throw new Error(
        `ثبت webhook ${label} ناموفق بود: ${error.description}. آدرس عمومی HTTPS (${env.APP_URL}) را بررسی کنید.`
      )
    }
    throw new Error(`ثبت webhook ${label} ناموفق بود.`)
  }

  await query(
    `INSERT INTO messenger_platform_settings (
       platform, enabled, webhook_secret_cipher, bot_username, webhook_set_at, updated_by
     ) VALUES ($1, TRUE, $2, $3, NOW(), $4)
     ON CONFLICT (platform) DO UPDATE SET
       enabled = TRUE,
       webhook_secret_cipher = EXCLUDED.webhook_secret_cipher,
       bot_username = EXCLUDED.bot_username,
       webhook_set_at = NOW(),
       updated_at = NOW(),
       updated_by = EXCLUDED.updated_by`,
    [platform, encryptSecret(secret), botUsername, userId]
  )

  return { botUsername, mode: 'webhook' }
}

async function activateRubikaWebhook(userId: string): Promise<{
  botUsername: string
  mode: 'webhook' | 'polling'
}> {
  const token = await getDecryptedMessengerToken('rubika')
  if (!token) {
    throw new Error('ابتدا توکن روبیکا را ذخیره کنید.')
  }

  let botUsername: string
  try {
    const me = await getRubikaMe(token)
    const fromUsername = me.username?.replace(/^@/, '') || null
    const fromShare = me.share_url
      ? extractUsernameFromShareUrl(me.share_url)
      : null
    botUsername = fromUsername || fromShare || ''
    if (!isPublicBotUsername(botUsername)) {
      throw new Error(
        'بات روبیکا باید username عمومی داشته باشد تا لینک ورود (?st=) کار کند. در BotFather روبیکا یک username تنظیم کنید.'
      )
    }
  } catch (error) {
    if (error instanceof RubikaApiError) {
      throw new Error(
        `توکن روبیکا نامعتبر است یا به Bot API دسترسی نیست: ${error.description}`
      )
    }
    if (error instanceof Error && error.message.includes('username')) {
      throw error
    }
    throw new Error('ارتباط با روبیکا برقرار نشد. دوباره تلاش کنید.')
  }

  const env = getEnv()
  const useWebhook = canUseBotWebhook(env.APP_URL)

  if (!useWebhook) {
    try {
      await clearBotEndpoints(token)
    } catch (error) {
      console.error('[messenger] clear Rubika endpoints before polling failed', error)
    }

    await query(
      `INSERT INTO messenger_platform_settings (
         platform, enabled, webhook_secret_cipher, bot_username, webhook_set_at, updated_by
       ) VALUES ('rubika', TRUE, NULL, $1, NULL, $2)
       ON CONFLICT (platform) DO UPDATE SET
         enabled = TRUE,
         webhook_secret_cipher = NULL,
         bot_username = EXCLUDED.bot_username,
         webhook_set_at = NULL,
         updated_at = NOW(),
         updated_by = EXCLUDED.updated_by`,
      [botUsername, userId]
    )

    console.log(
      `[messenger] روبیکا bot @${botUsername} enabled in polling mode (APP_URL=${env.APP_URL} is not public HTTPS)`
    )
    return { botUsername, mode: 'polling' }
  }

  const secret = generateWebhookSecret()
  const base = env.APP_URL.replace(/\/$/, '')
  const webhookUrl = `${base}${botWebhookPath('rubika')}?secret=${encodeURIComponent(secret)}`

  try {
    await updateBotEndpoints(token, webhookUrl, 'ReceiveUpdate')
    await updateBotEndpoints(token, webhookUrl, 'ReceiveInlineMessage')
  } catch (error) {
    if (error instanceof RubikaApiError) {
      throw new Error(
        `ثبت webhook روبیکا ناموفق بود: ${error.description}. آدرس عمومی HTTPS (${env.APP_URL}) را بررسی کنید.`
      )
    }
    throw new Error('ثبت webhook روبیکا ناموفق بود.')
  }

  await query(
    `INSERT INTO messenger_platform_settings (
       platform, enabled, webhook_secret_cipher, bot_username, webhook_set_at, updated_by
     ) VALUES ('rubika', TRUE, $1, $2, NOW(), $3)
     ON CONFLICT (platform) DO UPDATE SET
       enabled = TRUE,
       webhook_secret_cipher = EXCLUDED.webhook_secret_cipher,
       bot_username = EXCLUDED.bot_username,
       webhook_set_at = NOW(),
       updated_at = NOW(),
       updated_by = EXCLUDED.updated_by`,
    [encryptSecret(secret), botUsername, userId]
  )

  return { botUsername, mode: 'webhook' }
}

async function teardownRubikaWebhook(userId: string): Promise<void> {
  const token = await getDecryptedMessengerToken('rubika')
  if (token) {
    try {
      await clearBotEndpoints(token)
    } catch (error) {
      console.error('[messenger] clear Rubika endpoints failed', error)
    }
  }
  await clearWebhookMetadata('rubika', userId)
}

export async function deleteMessengerToken(
  platform: MessengerPlatform,
  userId: string
): Promise<{
  messenger: MessengerTokenStatus
  notificationDelivery?: NotificationDeliverySettings
}> {
  if (isBotApiPlatform(platform)) {
    await teardownBotWebhook(platform, userId)
  } else if (platform === 'rubika') {
    await teardownRubikaWebhook(userId)
  }

  await query(`DELETE FROM messenger_bot_tokens WHERE platform = $1`, [platform])
  return setMessengerEnabled(platform, false, userId, { skipTeardown: true })
}

export async function setMessengerEnabled(
  platform: MessengerPlatform,
  enabled: boolean,
  userId: string,
  options?: { skipTeardown?: boolean }
): Promise<{
  messenger: MessengerTokenStatus
  notificationDelivery?: NotificationDeliverySettings
}> {
  if (platform === 'rubika' && !RUBIKA_CHATBOT_ENABLED) {
    throw new Error(
      'چت‌بات روبیکا فعلاً در دمو غیرفعال است و به‌زودی فعال می‌شود.'
    )
  }

  if (enabled) {
    const configured = await isMessengerTokenConfigured(platform)
    if (!configured) {
      throw new Error('برای فعال‌سازی چت‌بات، ابتدا توکن را ثبت کنید.')
    }

    if (isBotApiPlatform(platform) || platform === 'rubika') {
      try {
        if (platform === 'rubika') {
          await activateRubikaWebhook(userId)
        } else {
          await activateBotWebhook(platform, userId)
        }
      } catch (error) {
        await query(
          `INSERT INTO messenger_platform_settings (platform, enabled, updated_by)
           VALUES ($1, FALSE, $2)
           ON CONFLICT (platform) DO UPDATE SET
             enabled = FALSE,
             updated_at = NOW(),
             updated_by = EXCLUDED.updated_by`,
          [platform, userId]
        )
        throw error
      }
    }
  } else {
    if (!options?.skipTeardown) {
      if (isBotApiPlatform(platform)) {
        await teardownBotWebhook(platform, userId)
      } else if (platform === 'rubika') {
        await teardownRubikaWebhook(userId)
      }
    }

    await query(
      `INSERT INTO messenger_platform_settings (platform, enabled, updated_by)
       VALUES ($1, FALSE, $2)
       ON CONFLICT (platform) DO UPDATE SET
         enabled = FALSE,
         updated_at = NOW(),
         updated_by = EXCLUDED.updated_by`,
      [platform, userId]
    )

    if (isBotApiPlatform(platform) || platform === 'rubika') {
      await clearWebhookMetadata(platform, userId)
      // Keep Telegram V2Ray config stored; SOCKS stays up for next enable / API tests.
    }
  }

  let notificationDelivery: NotificationDeliverySettings | undefined
  if (!enabled) {
    const delivery = await getNotificationDeliverySettings()
    if (
      delivery.clientChannel === 'chatbot' &&
      delivery.clientChatbotPlatforms.includes(platform)
    ) {
      const remaining = delivery.clientChatbotPlatforms.filter(
        (p) => p !== platform
      )
      notificationDelivery = await updateNotificationDeliverySettings(
        remaining.length === 0
          ? { clientChannel: 'in_app', clientChatbotPlatforms: [] }
          : {
              clientChannel: 'chatbot',
              clientChatbotPlatforms: remaining,
            },
        userId
      )
    }
  }

  const statuses = await getMessengerTokensStatus()
  const messenger = statuses.find((s) => s.platform === platform)
  if (!messenger) {
    throw new Error('Failed to update messenger status')
  }

  return { messenger, notificationDelivery }
}

export async function getNotificationDeliverySettings(): Promise<NotificationDeliverySettings> {
  const { rows } = await query<DeliveryRow>(
    `SELECT client_channel, client_chatbot_platforms, updated_at
     FROM notification_delivery_settings
     WHERE id = 1
     LIMIT 1`
  )

  const row = rows[0]
  if (!row) {
    return {
      clientChannel: 'in_app',
      clientChatbotPlatforms: [],
      updatedAt: null,
    }
  }

  return {
    clientChannel: row.client_channel,
    clientChatbotPlatforms: coerceMessengerPlatforms(
      row.client_chatbot_platforms
    ),
    updatedAt: toIso(row.updated_at),
  }
}

export async function updateNotificationDeliverySettings(
  input: {
    clientChannel: ClientNotificationChannel
    clientChatbotPlatforms?: MessengerPlatform[] | null
  },
  userId: string
): Promise<NotificationDeliverySettings> {
  const chatbotPlatforms =
    input.clientChannel === 'chatbot'
      ? normalizeMessengerPlatforms(input.clientChatbotPlatforms)
      : []

  await query(
    `INSERT INTO notification_delivery_settings (
       id, client_channel, client_chatbot_platforms, updated_by
     ) VALUES (1, $1, $2::messenger_platform[], $3)
     ON CONFLICT (id) DO UPDATE SET
       client_channel = EXCLUDED.client_channel,
       client_chatbot_platforms = EXCLUDED.client_chatbot_platforms,
       updated_at = NOW(),
       updated_by = EXCLUDED.updated_by`,
    [input.clientChannel, chatbotPlatforms, userId]
  )

  return getNotificationDeliverySettings()
}

export async function getAvailableMessengerPlatforms(): Promise<
  MessengerPlatform[]
> {
  const statuses = await getMessengerTokensStatus()
  return statuses
    .filter((s) => s.configured && s.enabled)
    .map((s) => s.platform)
}

export async function getUserNotificationPreferences(
  userId: string
): Promise<UserNotificationPreferences> {
  const { rows } = await query<UserPreferencesRow>(
    `SELECT channel, chatbot_platforms, updated_at
     FROM user_notification_preferences
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  )

  const row = rows[0]
  if (!row) {
    return {
      channel: 'in_app',
      chatbotPlatforms: [],
      updatedAt: null,
    }
  }

  return {
    channel: row.channel,
    chatbotPlatforms: coerceMessengerPlatforms(row.chatbot_platforms),
    updatedAt: toIso(row.updated_at),
  }
}

export async function updateUserNotificationPreferences(
  userId: string,
  input: {
    channel: ClientNotificationChannel
    chatbotPlatforms?: MessengerPlatform[] | null
  }
): Promise<UserNotificationPreferences> {
  const chatbotPlatforms =
    input.channel === 'chatbot'
      ? normalizeMessengerPlatforms(input.chatbotPlatforms)
      : []

  await query(
    `INSERT INTO user_notification_preferences (user_id, channel, chatbot_platforms)
     VALUES ($1, $2, $3::messenger_platform[])
     ON CONFLICT (user_id) DO UPDATE SET
       channel = EXCLUDED.channel,
       chatbot_platforms = EXCLUDED.chatbot_platforms,
       updated_at = NOW()`,
    [userId, input.channel, chatbotPlatforms]
  )

  return getUserNotificationPreferences(userId)
}
