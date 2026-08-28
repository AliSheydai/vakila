import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { getSessionTokenFromRequest } from '@/server/auth/cookies'
import { requireRole, requireUser } from '@/server/auth/require-user'
import { getSessionUser } from '@/server/auth/session'
import { isValidIranianMobile } from '@/server/phone'
import * as consultationRequestsRepo from '@/server/repositories/consultation-requests-repo'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])

    const url = new URL(request.url)
    if (url.searchParams.get('count') === 'new') {
      const count = await consultationRequestsRepo.countNewConsultationRequests(
        user.id
      )
      return ok({ count })
    }

    return ok(await consultationRequestsRepo.listConsultationRequests(user.id))
  })
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = await readJson<{
      name?: string
      phone?: string
      message?: string
    }>(request)

    const name = body?.name?.trim()
    const phone = body?.phone?.trim()
    const message = body?.message?.trim()

    if (!name || !phone || !message) {
      return fail('name, phone and message are required')
    }

    if (!isValidIranianMobile(phone)) {
      return fail('شماره موبایل معتبر نیست')
    }

    let requesterUserId: string | null = null
    const token = getSessionTokenFromRequest(request)
    if (token) {
      const sessionUser = await getSessionUser(token)
      if (sessionUser) {
        requesterUserId = sessionUser.id
      }
    }

    const created = await consultationRequestsRepo.createConsultationRequest(
      { name, phone, message },
      requesterUserId
    )

    return ok(created, { status: 201 })
  })
}
