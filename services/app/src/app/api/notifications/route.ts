import { ok, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import * as notificationsRepo from '@/server/repositories/notifications-repo'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const url = new URL(request.url)

    if (url.searchParams.get('count') === 'unread') {
      const count = await notificationsRepo.countUnreadNotifications(user.id)
      return ok({ count })
    }

    const unreadOnly = url.searchParams.get('unreadOnly') === 'true'
    const rawLimit = url.searchParams.get('limit')
    const limit = rawLimit
      ? Math.min(Math.max(1, Number(rawLimit) || 50), 100)
      : undefined
    const cursor = url.searchParams.get('cursor') ?? undefined

    const items = await notificationsRepo.listNotifications(user.id, {
      unreadOnly,
      limit,
      cursor,
    })

    return ok({ items })
  })
}
