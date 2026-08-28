import { ok, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import { getEnv } from '@/server/env'
import * as settingsRepo from '@/server/repositories/settings-repo'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['super_admin'])

    const [messengers, notificationDelivery] = await Promise.all([
      settingsRepo.getMessengerTokensStatus(),
      settingsRepo.getNotificationDeliverySettings(),
    ])

    let smsConfigured = false
    try {
      const env = getEnv()
      smsConfigured = Boolean(env.FERZZ_TOKEN && env.FERZZ_TOKEN.length > 0)
    } catch {
      smsConfigured = false
    }

    return ok({
      messengers,
      notificationDelivery,
      smsConfigured,
    })
  })
}
