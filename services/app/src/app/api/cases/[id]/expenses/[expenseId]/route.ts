import { fail, ok, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as casesRepo from '@/server/repositories/cases-repo'

type Ctx = { params: Promise<{ id: string; expenseId: string }> }

export async function DELETE(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id, expenseId } = await ctx.params
    const deleted = await casesRepo.deleteExpense(user.id, id, expenseId)
    if (!deleted) return fail('Expense not found', 404)
    return ok({ deleted: true })
  })
}
