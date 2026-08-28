import { fail, ok, toPublicUser, withApiHandler } from '@/server/api'
import { getSessionTokenFromRequest } from '@/server/auth/cookies'
import { getSessionUser } from '@/server/auth/session'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const token = getSessionTokenFromRequest(request)
    if (!token) return fail('Unauthorized', 401)

    const user = await getSessionUser(token)
    if (!user) return fail('Unauthorized', 401)

    return ok({
      user: toPublicUser(user),
      needsName: !user.name,
    })
  })
}
