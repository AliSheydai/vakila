import { ok, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as notificationsRepo from '@/server/repositories/notifications-repo'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])

    const items = await notificationsRepo.listClientUnseenActivity(user.id)
    const total = items.reduce((sum, item) => sum + item.total, 0)

    return ok({ items, total })
  })
}
