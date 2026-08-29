import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as settingsRepo from '@/server/repositories/settings-repo'
import type {
  ClientNotificationChannel,
  MessengerPlatform,
} from '@/server/repositories/settings-repo'

const CHANNELS = new Set<ClientNotificationChannel>([
  'in_app',
  'sms',
  'chatbot',
])
const PLATFORMS = new Set<MessengerPlatform>(['telegram', 'bale', 'rubika'])

type PatchBody = {
  channel?: string
  chatbotPlatform?: string | null
}

export async function PATCH(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['client'])

    const body = await readJson<PatchBody>(request)
    if (!body) {
      return fail('درخواست نامعتبر است.')
    }

    const channel = body.channel as ClientNotificationChannel
    if (!channel || !CHANNELS.has(channel)) {
      return fail('کانال اعلان نامعتبر است.')
    }

    let chatbotPlatform: MessengerPlatform | null = null

    if (channel === 'chatbot') {
      const platform = body.chatbotPlatform as MessengerPlatform
      if (!platform || !PLATFORMS.has(platform)) {
        return fail('لطفاً پیام‌رسان چت‌بات را انتخاب کنید.')
      }

      const configured = await settingsRepo.isMessengerReady(platform)
      if (!configured) {
        return fail('این پیام‌رسان در حال حاضر فعال نیست.')
      }

      chatbotPlatform = platform
    }

    const notificationPreferences =
      await settingsRepo.updateUserNotificationPreferences(user.id, {
        channel,
        chatbotPlatform,
      })

    return ok({ notificationPreferences })
  })
}
