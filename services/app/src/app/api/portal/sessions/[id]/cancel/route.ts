import { fail, ok, sanitizeError, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import { cancelPortalSession } from '@/server/repositories/portal-repo'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['client'])
    const { id } = await ctx.params

    try {
      await cancelPortalSession(user, id)
      return ok({ cancelled: true })
    } catch (error) {
      return fail(sanitizeError(error, 'Unable to cancel session'), 400)
    }
  })
}
