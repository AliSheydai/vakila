import { fail, ok, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as casesRepo from '@/server/repositories/cases-repo'

type Ctx = { params: Promise<{ id: string; attachmentId: string }> }

export async function DELETE(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id, attachmentId } = await ctx.params
    const deleted = await casesRepo.deleteAttachment(user.id, id, attachmentId)
    if (!deleted) return fail('Attachment not found', 404)
    return ok({ deleted: true })
  })
}
