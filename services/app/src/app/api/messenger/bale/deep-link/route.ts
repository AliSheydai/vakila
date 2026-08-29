import { ok, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import {
  buildBotDeepLink,
  createBotStartPayload,
  isPublicBotUsername,
} from '@/server/messenger/telegram/deep-link'
import * as settingsRepo from '@/server/repositories/settings-repo'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)

    const ready = await settingsRepo.isMessengerReady('bale')
    if (!ready) {
      return ok({
        enabled: false as const,
        botUsername: null,
        url: null,
      })
    }

    const statuses = await settingsRepo.getMessengerTokensStatus()
    const status = statuses.find((s) => s.platform === 'bale')
    const botUsername = status?.botUsername
    if (!isPublicBotUsername(botUsername)) {
      return ok({
        enabled: false as const,
        botUsername: null,
        url: null,
      })
    }

    const payload = createBotStartPayload('bale', user.id)
    const url = buildBotDeepLink('bale', botUsername!, payload)

    return ok({
      enabled: true as const,
      botUsername,
      url,
      mode: status.webhookSetAt ? ('webhook' as const) : ('polling' as const),
    })
  })
}
