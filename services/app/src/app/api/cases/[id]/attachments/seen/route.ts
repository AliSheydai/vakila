import { fail, ok, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as casesRepo from '@/server/repositories/cases-repo'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params

    const marked = await casesRepo.markClientDocumentsSeen(user.id, id)
    if (marked === 0) {
      const owned = await casesRepo.getCase(user.id, id)
      if (!owned) return fail('Case not found', 404)
    }

    return ok({ marked })
  })
}
