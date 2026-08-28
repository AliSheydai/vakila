import { fail, ok, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as casesRepo from '@/server/repositories/cases-repo'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params

    const count = await casesRepo.countUnseenClientComments(user.id, id)
    if (count === null) return fail('Case not found', 404)
    return ok({ count })
  })
}
