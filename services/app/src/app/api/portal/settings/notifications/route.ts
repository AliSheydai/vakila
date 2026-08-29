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
  chatbotPlatforms?: string[] | null
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

    let chatbotPlatforms: MessengerPlatform[] = []

    if (channel === 'chatbot') {
      const raw = Array.isArray(body.chatbotPlatforms)
        ? body.chatbotPlatforms
        : []
      const platforms = settingsRepo.normalizeMessengerPlatforms(
        raw.filter((p): p is MessengerPlatform => PLATFORMS.has(p as MessengerPlatform))
      )

      if (platforms.length === 0) {
        return fail('لطفاً حداقل یک پیام‌رسان چت‌بات را انتخاب کنید.')
      }

      for (const platform of platforms) {
        const configured = await settingsRepo.isMessengerReady(platform)
        if (!configured) {
          return fail('یکی از پیام‌رسان‌های انتخاب‌شده در حال حاضر فعال نیست.')
        }
      }

      chatbotPlatforms = platforms
    }

    const notificationPreferences =
      await settingsRepo.updateUserNotificationPreferences(user.id, {
        channel,
        chatbotPlatforms,
      })

    return ok({ notificationPreferences })
  })
}
