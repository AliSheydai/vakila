import { fail, ok, readJson, sanitizeError, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import { addPortalComment } from '@/server/repositories/portal-repo'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['client'])
    const { id } = await ctx.params

    const body = await readJson<{
      bodyHtml?: string
      attachments?: { name: string; mimeType: string; size: number }[]
    }>(request)

    try {
      const comment = await addPortalComment(user, id, {
        bodyHtml: body?.bodyHtml ?? '',
        attachments: body?.attachments,
      })
      return ok(comment, { status: 201 })
    } catch (error) {
      return fail(sanitizeError(error, 'Unable to add comment'), 400)
    }
  })
}
