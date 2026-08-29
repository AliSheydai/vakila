import { ok, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import {
  buildTelegramDeepLink,
  createTelegramStartPayload,
} from '@/server/messenger/telegram/deep-link'
import * as settingsRepo from '@/server/repositories/settings-repo'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)

    const ready = await settingsRepo.isMessengerReady('telegram')
    if (!ready) {
      return ok({
        enabled: false as const,
        botUsername: null,
        url: null,
      })
    }

    const statuses = await settingsRepo.getMessengerTokensStatus()
    const telegram = statuses.find((s) => s.platform === 'telegram')
    const botUsername = telegram?.botUsername
    if (!botUsername) {
      return ok({
        enabled: false as const,
        botUsername: null,
        url: null,
      })
    }

    const payload = createTelegramStartPayload(user.id)
    const url = buildTelegramDeepLink(botUsername, payload)

    return ok({
      enabled: true as const,
      botUsername,
      url,
      mode: telegram.webhookSetAt ? ('webhook' as const) : ('polling' as const),
    })
  })
}
