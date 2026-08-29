import { ok, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import {
  buildBotDeepLink,
  createBotStartPayload,
  isPublicBotUsername,
} from '@/server/messenger/telegram/deep-link'
import { RUBIKA_CHATBOT_ENABLED } from '@/server/messenger/rubika/feature'
import * as settingsRepo from '@/server/repositories/settings-repo'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)

    // Rubika chatbot temporarily disabled for site demo
    if (!RUBIKA_CHATBOT_ENABLED) {
      return ok({
        enabled: false as const,
        botUsername: null,
        url: null,
      })
    }

    const ready = await settingsRepo.isMessengerReady('rubika')
    if (!ready) {
      return ok({
        enabled: false as const,
        botUsername: null,
        url: null,
      })
    }

    const statuses = await settingsRepo.getMessengerTokensStatus()
    const status = statuses.find((s) => s.platform === 'rubika')
    const botUsername = status?.botUsername
    if (!isPublicBotUsername(botUsername)) {
      return ok({
        enabled: false as const,
        botUsername: null,
        url: null,
      })
    }

    const payload = createBotStartPayload('rubika', user.id)
    const url = buildBotDeepLink('rubika', botUsername!, payload)

    return ok({
      enabled: true as const,
      botUsername,
      url,
      mode: status.webhookSetAt ? ('webhook' as const) : ('polling' as const),
    })
  })
}
