import { fail, ok, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as casesRepo from '@/server/repositories/cases-repo'

type Ctx = { params: Promise<{ id: string; paymentId: string }> }

export async function DELETE(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id, paymentId } = await ctx.params
    const deleted = await casesRepo.deletePayment(user.id, id, paymentId)
    if (!deleted) return fail('Payment not found', 404)
    return ok({ deleted: true })
  })
}
