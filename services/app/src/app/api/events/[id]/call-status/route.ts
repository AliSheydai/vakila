import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import { CALL_STATUSES, type CallStatus } from '@/features/video-call/types'
import * as eventsRepo from '@/server/repositories/events-repo'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const { id } = await context.params

    const row = await eventsRepo.getEventForParticipant(id, user.id, user.role)
    if (!row) {
      return fail('جلسه یافت نشد.', 404)
    }

    const body = await readJson<{ callStatus?: CallStatus }>(request)
    if (!body?.callStatus || !CALL_STATUSES.includes(body.callStatus)) {
      return fail('وضعیت تماس نامعتبر است.')
    }

    await eventsRepo.updateCallStatus(id, body.callStatus)
    return ok({ callStatus: body.callStatus })
  })
}
