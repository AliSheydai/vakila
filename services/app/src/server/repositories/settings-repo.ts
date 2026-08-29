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
import { canUseTelegramWebhook } from '../messenger/telegram/webhook-url'

export type MessengerPlatform = 'telegram' | 'bale' | 'rubika'
export type ClientNotificationChannel = 'in_app' | 'sms' | 'chatbot'

export type MessengerTokenStatus = {
  platform: MessengerPlatform
  configured: boolean
  enabled: boolean
  hint: string | null
  botUsername: string | null
  webhookSetAt: string | null
  updatedAt: string | null
}

export type NotificationDeliverySettings = {
  clientChannel: ClientNotificationChannel
  clientChatbotPlatform: MessengerPlatform | null
  updatedAt: string | null
}

const PLATFORMS: MessengerPlatform[] = ['telegram', 'bale', 'rubika']

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
  updated_at: Date | string
}

type DeliveryRow = {
  client_channel: ClientNotificationChannel
  client_chatbot_platform: MessengerPlatform | null
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
              webhook_set_at, updated_at
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

    if (!row) {
      return {
        platform,
        configured: false,
        enabled: settings?.enabled ?? false,
        hint: null,
        botUsername: settings?.bot_username ?? null,
        webhookSetAt: settings ? toIso(settings.webhook_set_at) : null,
        updatedAt: settings ? toIso(settings.updated_at) : null,
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
    }
  })
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

async function teardownTelegramWebhook(userId: string): Promise<void> {
  const token = await getDecryptedMessengerToken('telegram')
  if (token) {
    try {
      await deleteWebhook(token)
    } catch (error) {
      console.error('[messenger] deleteWebhook failed', error)
    }
  }
  await clearWebhookMetadata('telegram', userId)
}

async function activateTelegramWebhook(userId: string): Promise<{
  botUsername: string
  mode: 'webhook' | 'polling'
}> {
  const token = await getDecryptedMessengerToken('telegram')
  if (!token) {
    throw new Error('ابتدا توکن تلگرام را ذخیره کنید.')
  }

  let botUsername: string
  try {
    const me = await getMe(token)
    botUsername = me.username ?? `id_${me.id}`
  } catch (error) {
    if (error instanceof TelegramApiError) {
      throw new Error(
        `توکن تلگرام نامعتبر است یا به Bot API دسترسی نیست: ${error.description}`
      )
    }
    throw new Error('ارتباط با تلگرام برقرار نشد. دوباره تلاش کنید.')
  }

  const env = getEnv()
  const useWebhook = canUseTelegramWebhook(env.APP_URL)

  if (!useWebhook) {
    // Local / non-HTTPS: long-polling via server poller (getUpdates)
    try {
      await deleteWebhook(token)
    } catch (error) {
      console.error('[messenger] deleteWebhook before polling failed', error)
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
      ['telegram', botUsername, userId]
    )

    console.log(
      `[messenger] Telegram bot @${botUsername} enabled in polling mode (APP_URL=${env.APP_URL} is not public HTTPS)`
    )
    return { botUsername, mode: 'polling' }
  }

  const secret = generateWebhookSecret()
  const webhookUrl = `${env.APP_URL.replace(/\/$/, '')}/api/webhooks/telegram`

  try {
    await setWebhook(token, {
      url: webhookUrl,
      secretToken: secret,
      allowedUpdates: ['message', 'callback_query'],
      dropPendingUpdates: true,
    })
  } catch (error) {
    if (error instanceof TelegramApiError) {
      throw new Error(
        `ثبت webhook تلگرام ناموفق بود: ${error.description}. آدرس عمومی HTTPS (${env.APP_URL}) را بررسی کنید.`
      )
    }
    throw new Error('ثبت webhook تلگرام ناموفق بود.')
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
    ['telegram', encryptSecret(secret), botUsername, userId]
  )

  return { botUsername, mode: 'webhook' }
}

export async function deleteMessengerToken(
  platform: MessengerPlatform,
  userId: string
): Promise<{
  messenger: MessengerTokenStatus
  notificationDelivery?: NotificationDeliverySettings
}> {
  if (platform === 'telegram') {
    await teardownTelegramWebhook(userId)
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
  if (enabled) {
    const configured = await isMessengerTokenConfigured(platform)
    if (!configured) {
      throw new Error('برای فعال‌سازی چت‌بات، ابتدا توکن را ثبت کنید.')
    }

    if (platform === 'telegram') {
      try {
        await activateTelegramWebhook(userId)
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
    } else {
      // Bale / Rubika runtime comes in a later phase — persist toggle only.
      await query(
        `INSERT INTO messenger_platform_settings (platform, enabled, updated_by)
         VALUES ($1, TRUE, $2)
         ON CONFLICT (platform) DO UPDATE SET
           enabled = TRUE,
           updated_at = NOW(),
           updated_by = EXCLUDED.updated_by`,
        [platform, userId]
      )
    }
  } else {
    if (platform === 'telegram' && !options?.skipTeardown) {
      await teardownTelegramWebhook(userId)
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

    if (platform === 'telegram') {
      await clearWebhookMetadata(platform, userId)
    }
  }

  let notificationDelivery: NotificationDeliverySettings | undefined
  if (!enabled) {
    const delivery = await getNotificationDeliverySettings()
    if (
      delivery.clientChannel === 'chatbot' &&
      delivery.clientChatbotPlatform === platform
    ) {
      notificationDelivery = await updateNotificationDeliverySettings(
        { clientChannel: 'in_app', clientChatbotPlatform: null },
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
    `SELECT client_channel, client_chatbot_platform, updated_at
     FROM notification_delivery_settings
     WHERE id = 1
     LIMIT 1`
  )

  const row = rows[0]
  if (!row) {
    return {
      clientChannel: 'in_app',
      clientChatbotPlatform: null,
      updatedAt: null,
    }
  }

  return {
    clientChannel: row.client_channel,
    clientChatbotPlatform: row.client_chatbot_platform,
    updatedAt: toIso(row.updated_at),
  }
}

export async function updateNotificationDeliverySettings(
  input: {
    clientChannel: ClientNotificationChannel
    clientChatbotPlatform?: MessengerPlatform | null
  },
  userId: string
): Promise<NotificationDeliverySettings> {
  const chatbotPlatform =
    input.clientChannel === 'chatbot' ? (input.clientChatbotPlatform ?? null) : null

  await query(
    `INSERT INTO notification_delivery_settings (
       id, client_channel, client_chatbot_platform, updated_by
     ) VALUES (1, $1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET
       client_channel = EXCLUDED.client_channel,
       client_chatbot_platform = EXCLUDED.client_chatbot_platform,
       updated_at = NOW(),
       updated_by = EXCLUDED.updated_by`,
    [input.clientChannel, chatbotPlatform, userId]
  )

  return getNotificationDeliverySettings()
}
