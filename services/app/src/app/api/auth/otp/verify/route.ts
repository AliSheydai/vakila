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
import {
  isTotpEnabledForUser,
  signTotpLoginChallenge,
} from '@/server/auth/totp'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = await readJson<{ phone?: string; code?: string }>(request)
    if (!body?.phone || !body?.code) {
      return fail('phone and code are required')
    }

    try {
      const { user, needsName } = await verifyOtp(body.phone, body.code)

      if (await isTotpEnabledForUser(user.id)) {
        const challengeToken = await signTotpLoginChallenge({
          userId: user.id,
          needsName,
        })
        return NextResponse.json({
          ok: true as const,
          data: {
            requiresTotp: true as const,
            challengeToken,
          },
        })
      }

      const jwt = await createSession(user.id, {
        role: user.role,
        userAgent: request.headers.get('user-agent'),
        ipAddress: getClientIp(request),
      })

      const response = NextResponse.json({
        ok: true as const,
        data: {
          requiresTotp: false as const,
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
