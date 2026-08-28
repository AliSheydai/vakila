import { fail, ok, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import { adminDeleteAttachment } from '@/server/repositories/attachments-repo'

type Ctx = { params: Promise<{ attachmentId: string }> }

export async function DELETE(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { attachmentId } = await ctx.params

    const deleted = await adminDeleteAttachment(
      attachmentId,
      user.id,
      user.role
    )
    if (!deleted) return fail('Attachment not found', 404)
    return ok({ deleted: true })
  })
}
