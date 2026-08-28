import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as casesRepo from '@/server/repositories/cases-repo'
import type { LegalArea, CaseStatus } from '@/features/cases/types'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    return ok(await casesRepo.listCases(user.id))
  })
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])

    const body = await readJson<{
      title?: string
      caseNumber?: string
      legalArea?: LegalArea
      status?: CaseStatus
      description?: string
      clientId?: string | null
    }>(request)

    if (!body?.title?.trim() || !body?.caseNumber?.trim() || !body?.legalArea) {
      return fail('title, caseNumber and legalArea are required')
    }

    const created = await casesRepo.createCase(user.id, {
      title: body.title,
      caseNumber: body.caseNumber,
      legalArea: body.legalArea,
      status: body.status,
      description: body.description,
      clientId: body.clientId,
    })
    return ok(created, { status: 201 })
  })
}
