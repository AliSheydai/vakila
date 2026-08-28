import { fail, ok, withApiHandler } from '@/server/api'
import { isLawyerRole, requireUser } from '@/server/auth/require-user'
import * as eventsRepo from '@/server/repositories/events-repo'
import { ymd, hhmm } from '@/server/mappers'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const { id } = await context.params

    const row = await eventsRepo.getEventForParticipant(id, user.id, user.role)
    if (!row) {
      return fail('جلسه یافت نشد.', 404)
    }

    if (row.type !== 'online_meeting') {
      return fail('این رویداد جلسه آنلاین نیست.', 400)
    }

    const role =
      row.owner_id === user.id || isLawyerRole(user.role) ? 'host' : 'client'

    return ok({
      id: row.id,
      title: row.title,
      date: ymd(row.event_date),
      startTime: hhmm(row.start_time),
      endTime: hhmm(row.end_time),
      status: row.status,
      callStatus: row.call_status,
      meetingUrl: row.meeting_url,
      role,
    })
  })
}
