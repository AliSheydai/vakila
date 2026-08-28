import { query } from '../db'
import {
  decryptSecret,
  encryptSecret,
  secretHint,
} from '../crypto'

export type MessengerPlatform = 'telegram' | 'bale' | 'rubika'
export type ClientNotificationChannel = 'in_app' | 'sms' | 'chatbot'

export type MessengerTokenStatus = {
  platform: MessengerPlatform
  configured: boolean
  enabled: boolean
  hint: string | null
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

export async function getMessengerTokensStatus(): Promise<
  MessengerTokenStatus[]
> {
  const [{ rows: tokenRows }, { rows: settingsRows }] = await Promise.all([
    query<TokenRow>(
      `SELECT platform, token_cipher, updated_at FROM messenger_bot_tokens`
    ),
    query<PlatformSettingsRow>(
      `SELECT platform, enabled, updated_at FROM messenger_platform_settings`
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

export async function deleteMessengerToken(
  platform: MessengerPlatform,
  userId: string
): Promise<{
  messenger: MessengerTokenStatus
  notificationDelivery?: NotificationDeliverySettings
}> {
  await query(`DELETE FROM messenger_bot_tokens WHERE platform = $1`, [platform])
  return setMessengerEnabled(platform, false, userId)
}

export async function setMessengerEnabled(
  platform: MessengerPlatform,
  enabled: boolean,
  userId: string
): Promise<{
  messenger: MessengerTokenStatus
  notificationDelivery?: NotificationDeliverySettings
}> {
  await query(
    `INSERT INTO messenger_platform_settings (platform, enabled, updated_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (platform) DO UPDATE SET
       enabled = EXCLUDED.enabled,
       updated_at = NOW(),
       updated_by = EXCLUDED.updated_by`,
    [platform, enabled, userId]
  )

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
