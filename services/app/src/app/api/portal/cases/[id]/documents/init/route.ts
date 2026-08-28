import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as attachmentsRepo from '@/server/repositories/attachments-repo'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['client'])
    const { id: caseId } = await ctx.params
    const body = await readJson<{
      name?: string
      mimeType?: string
      size?: number
    }>(request)

    if (!body?.name?.trim() || !body?.mimeType || body.size == null) {
      return fail('name, mimeType and size are required')
    }

    const result = await attachmentsRepo.initPortalCaseDocument(
      user.id,
      caseId,
      {
        name: body.name,
        mimeType: body.mimeType,
        size: Number(body.size),
        uploadedBy: user.id,
      }
    )
    if (!result) return fail('Case not found', 404)
    return ok(result, { status: 201 })
  })
}
