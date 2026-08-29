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
  proxy?: MessengerProxyStatus
}

export type NotificationDeliverySettings = {
  clientChannel: ClientNotificationChannel
  clientChatbotPlatform: MessengerPlatform | null
  updatedAt: string | null
}

export type AdminSettingsData = {
  messengers: MessengerTokenStatus[]
  notificationDelivery: NotificationDeliverySettings
  smsConfigured: boolean
}

export const MESSENGER_LABELS: Record<MessengerPlatform, string> = {
  telegram: 'تلگرام',
  bale: 'بله',
  rubika: 'روبیکا',
}

export const CHANNEL_LABELS: Record<ClientNotificationChannel, string> = {
  in_app: 'فقط داخل پورتال',
  sms: 'پیامک',
  chatbot: 'چت‌بات پیام‌رسان',
}
