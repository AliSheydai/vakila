import { fail, ok, sanitizeError, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as attachmentsRepo from '@/server/repositories/attachments-repo'

type Ctx = { params: Promise<{ id: string; attachmentId: string }> }

export async function POST(_request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(_request)
    requireRole(user, ['client'])
    const { attachmentId } = await ctx.params

    const attachment = await attachmentsRepo.completeAttachment(
      attachmentId,
      user.id,
      'client'
    )
    if (!attachment) return fail('Attachment not found', 404)
    return ok(attachment)
  })
}

export async function GET(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['client'])
    const { attachmentId } = await ctx.params

    const download = await attachmentsRepo.getAttachmentDownloadUrl(
      attachmentId,
      user.id,
      'client'
    )
    if (!download) return fail('Attachment not found', 404)
    return ok(download)
  })
}

export async function DELETE(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['client'])
    const { attachmentId } = await ctx.params

    try {
      const deleted = await attachmentsRepo.deleteAttachmentWithObject(
        attachmentId,
        user.id,
        'client'
      )
      if (!deleted) return fail('Attachment not found', 404)
      return ok({ deleted: true })
    } catch (error) {
      return fail(sanitizeError(error, 'Unable to delete attachment'), 400)
    }
  })
}
