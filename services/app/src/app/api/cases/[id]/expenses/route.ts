import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as casesRepo from '@/server/repositories/cases-repo'
import type { ExpenseCategory } from '@/features/cases/types'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params
    const body = await readJson<{
      title?: string
      category?: ExpenseCategory
      amount?: number
      date?: string
      description?: string
    }>(request)

    if (!body?.title?.trim() || !body?.category || !body?.amount || !body?.date) {
      return fail('title, category, amount and date are required')
    }

    const expense = await casesRepo.addExpense(user.id, id, {
      title: body.title,
      category: body.category,
      amount: Number(body.amount),
      date: body.date,
      description: body.description,
    })
    if (!expense) return fail('Case not found', 404)
    return ok(expense, { status: 201 })
  })
}
