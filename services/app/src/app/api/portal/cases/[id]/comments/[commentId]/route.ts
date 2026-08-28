import { fail, ok, sanitizeError, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import { deletePortalComment } from '@/server/repositories/portal-repo'

type Ctx = { params: Promise<{ id: string; commentId: string }> }

export async function DELETE(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['client'])
    const { id, commentId } = await ctx.params

    try {
      await deletePortalComment(user, id, commentId)
      return ok({ deleted: true })
    } catch (error) {
      return fail(sanitizeError(error, 'Unable to delete comment'), 400)
    }
  })
}
