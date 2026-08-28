import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as casesRepo from '@/server/repositories/cases-repo'
import type {
  PaymentMethod,
  PaymentRecordStatus,
  PaymentSource,
} from '@/features/cases/types'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params
    const body = await readJson<{
      amount?: number
      date?: string
      method?: PaymentMethod
      description?: string
      source?: PaymentSource
      status?: PaymentRecordStatus
      externalTransactionId?: string
    }>(request)

    if (!body?.amount || !body?.date || !body?.method) {
      return fail('amount, date and method are required')
    }

    const payment = await casesRepo.addPayment(user.id, id, {
      amount: Number(body.amount),
      date: body.date,
      method: body.method,
      description: body.description,
      source: body.source,
      status: body.status,
      externalTransactionId: body.externalTransactionId,
    })
    if (!payment) return fail('Case not found', 404)
    return ok(payment, { status: 201 })
  })
}
