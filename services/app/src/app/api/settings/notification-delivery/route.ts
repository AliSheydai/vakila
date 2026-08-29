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
  clientChannel?: string
  clientChatbotPlatforms?: string[] | null
}

export async function PATCH(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['super_admin'])

    const body = await readJson<PatchBody>(request)
    if (!body) {
      return fail('درخواست نامعتبر است.')
    }

    const clientChannel = body.clientChannel as ClientNotificationChannel
    if (!clientChannel || !CHANNELS.has(clientChannel)) {
      return fail('کانال اعلان نامعتبر است.')
    }

    let clientChatbotPlatforms: MessengerPlatform[] = []

    if (clientChannel === 'chatbot') {
      const raw = Array.isArray(body.clientChatbotPlatforms)
        ? body.clientChatbotPlatforms
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
          return fail(
            'همه پیام‌رسان‌های انتخاب‌شده باید توکن داشته باشند و چت‌بات آن‌ها فعال باشد.'
          )
        }
      }

      clientChatbotPlatforms = platforms
    }

    const settings = await settingsRepo.updateNotificationDeliverySettings(
      { clientChannel, clientChatbotPlatforms },
      user.id
    )

    return ok({ notificationDelivery: settings })
  })
}
