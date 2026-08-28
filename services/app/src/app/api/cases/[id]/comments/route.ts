import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as casesRepo from '@/server/repositories/cases-repo'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params
    const comments = await casesRepo.listComments(user.id, id)
    if (!comments) return fail('Case not found', 404)
    return ok(comments)
  })
}

export async function POST(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params
    const body = await readJson<{ bodyHtml?: string }>(request)
    if (!body?.bodyHtml?.trim()) return fail('bodyHtml is required')

    const comment = await casesRepo.addComment(user.id, id, {
      bodyHtml: body.bodyHtml,
      authorName: user.name || 'وکیل',
      authorId: user.id,
    })
    if (!comment) return fail('Case not found', 404)
    return ok(comment, { status: 201 })
  })
}
