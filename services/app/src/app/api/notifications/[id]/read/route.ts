import { fail, ok, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import * as notificationsRepo from '@/server/repositories/notifications-repo'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const { id } = await context.params

    const updated = await notificationsRepo.markNotificationRead(user.id, id)
    if (!updated) {
      return fail('اعلان یافت نشد', 404)
    }

    return ok(updated)
  })
}
