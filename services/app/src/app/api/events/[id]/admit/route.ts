import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { isLawyerRole, requireUser } from '@/server/auth/require-user'
import { admitParticipant, removeParticipant } from '@/server/livekit/room'
import * as eventsRepo from '@/server/repositories/events-repo'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    if (!isLawyerRole(user.role)) {
      return fail('فقط وکیل می‌تواند موکل را بپذیرد.', 403)
    }

    const { id } = await context.params
    const row = await eventsRepo.getEventRowById(id)
    if (!row || row.owner_id !== user.id) {
      return fail('جلسه یافت نشد.', 404)
    }

    const body = await readJson<{ participantId?: string; action?: 'admit' | 'reject' }>(
      request
    )

    if (!body?.participantId) {
      return fail('شناسه شرکت‌کننده الزامی است.')
    }

    if (body.action === 'reject') {
      await removeParticipant(id, body.participantId)
      return ok({ action: 'rejected' })
    }

    await admitParticipant(id, body.participantId)
    await eventsRepo.updateCallStatus(id, 'in_call')

    return ok({ action: 'admitted' })
  })
}
