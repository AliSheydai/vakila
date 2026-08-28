import { ok, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as notificationsRepo from '@/server/repositories/notifications-repo'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id: caseId } = await context.params

    const count = await notificationsRepo.countUnseenClientDocuments(
      user.id,
      caseId
    )

    return ok({ count: count ?? 0 })
  })
}
