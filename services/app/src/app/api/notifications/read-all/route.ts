import { ok, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import * as notificationsRepo from '@/server/repositories/notifications-repo'

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const count = await notificationsRepo.markAllNotificationsRead(user.id)
    return ok({ count })
  })
}
