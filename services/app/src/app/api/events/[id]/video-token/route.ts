import { fail, ok, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import { isWithinCallWindow } from '@/server/livekit/call-window'
import { checkRateLimit } from '@/server/livekit/rate-limit'
import { ensureRoom } from '@/server/livekit/room'
import {
  createVideoToken,
  getLiveKitPublicUrl,
} from '@/server/livekit/token'
import { query } from '@/server/db'
import * as eventsRepo from '@/server/repositories/events-repo'
import { ymd, hhmm } from '@/server/mappers'

type RouteContext = { params: Promise<{ id: string }> }

async function getDisplayName(userId: string): Promise<string> {
  const { rows } = await query<{ name: string | null; role: string }>(
    `SELECT name, role FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  )
  const row = rows[0]
  if (!row) return 'کاربر'
  if (row.name?.trim()) return row.name.trim()
  return row.role === 'client' ? 'موکل' : 'وکیل'
}

export async function GET(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const { id } = await context.params

    if (!checkRateLimit(user.id)) {
      return fail('تعداد درخواست‌های شما زیاد است. لطفاً چند دقیقه صبر کنید.', 429)
    }

    const row = await eventsRepo.getEventForParticipant(id, user.id, user.role)
    if (!row) {
      return fail('جلسه یافت نشد یا دسترسی ندارید.', 404)
    }

    if (row.type !== 'online_meeting') {
      return fail('این رویداد جلسه آنلاین نیست.', 400)
    }

    if (row.status === 'cancelled') {
      return fail('این جلسه لغو شده است.', 400)
    }

    const date = ymd(row.event_date)
    const startTime = hhmm(row.start_time)
    const endTime = hhmm(row.end_time)

    if (
      !isWithinCallWindow({
        date,
        startTime,
        endTime,
        status: row.status,
      })
    ) {
      return fail(
        'هنوز زمان ورود به جلسه فرا نرسیده یا پنجره ورود بسته شده است.',
        403
      )
    }

    const isHost = row.owner_id === user.id
    const isClient = row.client_user_id === user.id
    const isAdmin = user.role === 'super_admin'

    if (!isHost && !isClient && !isAdmin) {
      return fail('دسترسی به این جلسه ندارید.', 403)
    }

    const role = isHost || isAdmin ? 'host' : 'client'
    const url = new URL(request.url)
    const skipWaiting = url.searchParams.get('skipWaiting') === '1'
    const canPublish = isHost || skipWaiting

    await ensureRoom(id)

    if (canPublish && isHost) {
      await eventsRepo.updateCallStatus(id, 'in_call')
    } else if (!canPublish) {
      await eventsRepo.updateCallStatus(id, 'waiting')
    }

    const displayName = await getDisplayName(user.id)
    const token = await createVideoToken({
      eventId: id,
      userId: user.id,
      displayName,
      role,
      canPublish,
    })

    return ok({
      token,
      roomName: `event_${id}`,
      livekitUrl: getLiveKitPublicUrl(),
      role,
      canPublish,
      eventTitle: row.title,
      displayName,
    })
  })
}
