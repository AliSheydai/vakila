import { fail, ok, withApiHandler } from '@/server/api'
import { isLawyerRole, requireUser } from '@/server/auth/require-user'
import * as eventsRepo from '@/server/repositories/events-repo'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    if (!isLawyerRole(user.role)) {
      return fail('فقط وکیل می‌تواند جلسه را تکمیل کند.', 403)
    }

    const { id } = await context.params
    const event = await eventsRepo.markEventCompleted(id, user.id, user.role)
    if (!event) {
      return fail('جلسه یافت نشد یا دسترسی تکمیل ندارید.', 404)
    }

    return ok(event)
  })
}
