export type MessengerPlatform = 'telegram' | 'bale' | 'rubika'
export type ClientNotificationChannel = 'in_app' | 'sms' | 'chatbot'

export type UserNotificationPreferences = {
  channel: ClientNotificationChannel
  chatbotPlatform: MessengerPlatform | null
  updatedAt: string | null
}

export type ClientSettingsData = {
  availableMessengers: MessengerPlatform[]
  notificationPreferences: UserNotificationPreferences
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
