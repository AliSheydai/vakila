import { ok, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import * as notificationsRepo from '@/server/repositories/notifications-repo'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const items = await notificationsRepo.countUnreadByCase(user.id)
    return ok({ items })
  })
}
