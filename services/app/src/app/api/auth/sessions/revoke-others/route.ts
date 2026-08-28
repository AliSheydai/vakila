import { fail, ok, withApiHandler } from '@/server/api'
import { getSessionTokenFromRequest } from '@/server/auth/cookies'
import { verifySessionJwt } from '@/server/auth/jwt'
import { requireUser } from '@/server/auth/require-user'
import { hashToken } from '@/server/crypto'
import { revokeOtherSessions } from '@/server/repositories/sessions-repo'

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const token = getSessionTokenFromRequest(request)
    if (!token) return fail('Unauthorized', 401)

    const claims = await verifySessionJwt(token)
    if (!claims) return fail('Unauthorized', 401)

    const currentHash = hashToken(claims.sid)
    const revokedCount = await revokeOtherSessions(user.id, currentHash)
    return ok({ revokedCount })
  })
}
