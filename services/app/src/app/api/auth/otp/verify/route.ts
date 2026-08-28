import {
  fail,
  getClientIp,
  readJson,
  sanitizeError,
  toPublicUser,
  withApiHandler,
} from '@/server/api'
import { setSessionCookie } from '@/server/auth/cookies'
import { verifyOtp } from '@/server/auth/otp'
import { createSession } from '@/server/auth/session'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = await readJson<{ phone?: string; code?: string }>(request)
    if (!body?.phone || !body?.code) {
      return fail('phone and code are required')
    }

    try {
      const { user, needsName } = await verifyOtp(body.phone, body.code)
      const jwt = await createSession(user.id, {
        role: user.role,
        userAgent: request.headers.get('user-agent'),
        ipAddress: getClientIp(request),
      })

      const response = NextResponse.json({
        ok: true as const,
        data: {
          user: toPublicUser(user),
          needsName,
        },
      })
      setSessionCookie(response, jwt)
      return response
    } catch (error) {
      return fail(sanitizeError(error, 'تأیید کد ناموفق بود'), 400)
    }
  })
}
