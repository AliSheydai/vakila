import { fail, ok, withApiHandler } from '@/server/api'
import { isLawyerRole, requireUser } from '@/server/auth/require-user'
import * as eventsRepo from '@/server/repositories/events-repo'
import * as notificationService from '@/server/services/notification-service'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    if (!isLawyerRole(user.role)) {
      return fail('فقط وکیل می‌تواند موکل را دعوت کند.', 403)
    }

    const { id } = await context.params
    const row = await eventsRepo.getEventForParticipant(id, user.id, user.role)
    if (!row || row.owner_id !== user.id) {
      return fail('جلسه یافت نشد.', 404)
    }

    if (row.type !== 'online_meeting') {
      return fail('این رویداد جلسه آنلاین نیست.', 400)
    }

    await eventsRepo.updateCallStatus(id, 'lobby')

    await notificationService.notifyVideoCallReady({
      clientUserId: row.client_user_id,
      actorId: user.id,
      eventId: id,
      caseId: row.case_id,
      clientId: row.client_id,
      title: row.title,
    })

    return ok({ callStatus: 'lobby' })
  })
}
