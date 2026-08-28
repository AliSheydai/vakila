import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as casesRepo from '@/server/repositories/cases-repo'
import type { CaseStatus, LegalArea } from '@/features/cases/types'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params
    const item = await casesRepo.getCase(user.id, id)
    if (!item) return fail('Case not found', 404)
    return ok(item)
  })
}

export async function PATCH(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params
    const body = await readJson<{
      title?: string
      caseNumber?: string
      legalArea?: LegalArea
      status?: CaseStatus
      description?: string
      clientId?: string | null
    }>(request)
    if (!body) return fail('Invalid JSON body')

    const item = await casesRepo.updateCase(user.id, id, body)
    if (!item) return fail('Case not found', 404)
    return ok(item)
  })
}

export async function DELETE(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params
    const deleted = await casesRepo.deleteCase(user.id, id)
    if (!deleted) return fail('Case not found', 404)
    return ok({ deleted: true })
  })
}
