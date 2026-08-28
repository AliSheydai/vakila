import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { isClientRole, isLawyerRole, requireUser } from '@/server/auth/require-user'
import * as eventsRepo from '@/server/repositories/events-repo'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const { id } = await context.params

    const row = await eventsRepo.getEventForParticipant(id, user.id, user.role)
    if (!row) {
      return fail('جلسه یافت نشد.', 404)
    }

    const body = await readJson<{ consent?: boolean }>(request)
    if (typeof body?.consent !== 'boolean') {
      return fail('مقدار رضایت نامعتبر است.')
    }

    if (isLawyerRole(user.role) && row.owner_id === user.id) {
      await eventsRepo.setRecordingConsent(id, 'lawyer', body.consent)
    } else if (isClientRole(user.role) && row.client_user_id === user.id) {
      await eventsRepo.setRecordingConsent(id, 'client', body.consent)
    } else {
      return fail('دسترسی ندارید.', 403)
    }

    const updated = await eventsRepo.getEventRowById(id)
    return ok({
      recordingConsentLawyer: updated?.recording_consent_lawyer ?? false,
      recordingConsentClient: updated?.recording_consent_client ?? false,
    })
  })
}
