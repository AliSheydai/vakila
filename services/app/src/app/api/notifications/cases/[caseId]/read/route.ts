import { ok, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import * as notificationsRepo from '@/server/repositories/notifications-repo'

export async function POST(
  request: Request,
  context: { params: Promise<{ caseId: string }> }
) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const { caseId } = await context.params

    const count = await notificationsRepo.markNotificationsReadForCase(
      user.id,
      caseId
    )

    return ok({ count })
  })
}
