import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as consultationRequestsRepo from '@/server/repositories/consultation-requests-repo'
import type { ConsultationRequestStatus } from '@/features/consultation-requests/types'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])

    const { id } = await context.params
    const item = await consultationRequestsRepo.getConsultationRequest(
      user.id,
      id
    )
    if (!item) return fail('Not found', 404)
    return ok(item)
  })
}

export async function PATCH(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])

    const { id } = await context.params
    const body = await readJson<{
      status?: ConsultationRequestStatus
      lawyerNotes?: string | null
      contactedAt?: string | null
    }>(request)

    const updated = await consultationRequestsRepo.updateConsultationRequest(
      user.id,
      id,
      {
        status: body?.status,
        lawyerNotes: body?.lawyerNotes,
        contactedAt: body?.contactedAt,
      }
    )

    if (!updated) return fail('Not found', 404)
    return ok(updated)
  })
}
