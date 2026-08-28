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
      amount?: number
      description?: string
      dueDate?: string | null
    }>(request)

    if (body?.amount == null || Number(body.amount) < 0) {
      return fail('amount is required')
    }

    const fee = await casesRepo.upsertFee(user.id, id, {
      amount: Number(body.amount),
      description: body.description,
      dueDate: body.dueDate,
    })
    if (!fee) return fail('Case not found', 404)
    return ok(fee)
  })
}
