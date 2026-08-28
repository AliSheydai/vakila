import { withApiHandler } from '@/server/api'
import {
  clearSessionCookie,
  getSessionTokenFromRequest,
} from '@/server/auth/cookies'
import { revokeSession } from '@/server/auth/session'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const token = getSessionTokenFromRequest(request)
    if (token) {
      await revokeSession(token)
    }

    const response = NextResponse.json({
      ok: true as const,
      data: { loggedOut: true },
    })
    clearSessionCookie(response)
    return response
  })
}
