import { ok, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import {
  buildBotDeepLink,
  createBotStartPayload,
  isPublicBotUsername,
} from '@/server/messenger/telegram/deep-link'
import type { BotApiPlatform } from '@/server/messenger/bot-platforms'
import * as settingsRepo from '@/server/repositories/settings-repo'

async function deepLinkForPlatform(
  request: Request,
  platform: BotApiPlatform
) {
  return withApiHandler(async () => {
    const user = await requireUser(request)

    const ready = await settingsRepo.isMessengerReady(platform)
    if (!ready) {
      return ok({
        enabled: false as const,
        botUsername: null,
        url: null,
      })
    }

    const statuses = await settingsRepo.getMessengerTokensStatus()
    const status = statuses.find((s) => s.platform === platform)
    const botUsername = status?.botUsername
    if (!isPublicBotUsername(botUsername)) {
      return ok({
        enabled: false as const,
        botUsername: null,
        url: null,
      })
    }

    const payload = createBotStartPayload(platform, user.id)
    const url = buildBotDeepLink(platform, botUsername!, payload)

    return ok({
      enabled: true as const,
      botUsername,
      url,
      mode: status.webhookSetAt ? ('webhook' as const) : ('polling' as const),
    })
  })
}

export async function GET(request: Request) {
  return deepLinkForPlatform(request, 'telegram')
}
