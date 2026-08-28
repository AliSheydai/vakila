import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as casesRepo from '@/server/repositories/cases-repo'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params
    const body = await readJson<{
      name?: string
      mimeType?: string
      size?: number
      uploadedBy?: string
    }>(request)

    if (!body?.name?.trim() || !body?.mimeType || body.size == null) {
      return fail('name, mimeType and size are required')
    }

    const attachment = await casesRepo.addAttachment(
      user.id,
      id,
      {
        name: body.name,
        mimeType: body.mimeType,
        size: Number(body.size),
        uploadedBy: body.uploadedBy,
      },
      user.id
    )
    if (!attachment) return fail('Case not found', 404)
    return ok(attachment, { status: 201 })
  })
}
