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
  clientChatbotPlatform?: string | null
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

    let clientChatbotPlatform: MessengerPlatform | null = null

    if (clientChannel === 'chatbot') {
      const platform = body.clientChatbotPlatform as MessengerPlatform
      if (!platform || !PLATFORMS.has(platform)) {
        return fail('لطفاً پیام‌رسان چت‌بات را انتخاب کنید.')
      }

      const configured = await settingsRepo.isMessengerReady(platform)
      if (!configured) {
        return fail(
          'این پیام‌رسان باید توکن داشته باشد و چت‌بات آن فعال باشد.'
        )
      }

      clientChatbotPlatform = platform
    }

    const settings = await settingsRepo.updateNotificationDeliverySettings(
      { clientChannel, clientChatbotPlatform },
      user.id
    )

    return ok({ notificationDelivery: settings })
  })
}
