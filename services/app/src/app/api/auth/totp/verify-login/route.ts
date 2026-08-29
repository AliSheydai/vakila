import {
  fail,
  getClientIp,
  readJson,
  sanitizeError,
  toPublicUser,
  withApiHandler,
} from '@/server/api'
import { setSessionCookie } from '@/server/auth/cookies'
import {
  getUserById,
  verifyTotpLoginChallenge,
  verifyUserTotp,
} from '@/server/auth/totp'
import { createSession } from '@/server/auth/session'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = await readJson<{ challengeToken?: string; code?: string }>(
      request
    )
    if (!body?.challengeToken || !body?.code) {
      return fail('challengeToken and code are required')
    }

    try {
      const challenge = await verifyTotpLoginChallenge(body.challengeToken)
      if (!challenge) {
        return fail('نشست تأیید منقضی شده است. دوباره وارد شوید.', 400)
      }

      const valid = await verifyUserTotp(challenge.userId, body.code)
      if (!valid) {
        return fail('کد تأیید نادرست است.', 400)
      }

      const user = await getUserById(challenge.userId)
      if (!user || !user.is_active) {
        return fail('این حساب غیرفعال است.', 400)
      }

      const jwt = await createSession(user.id, {
        role: user.role,
        userAgent: request.headers.get('user-agent'),
        ipAddress: getClientIp(request),
      })

      const response = NextResponse.json({
        ok: true as const,
        data: {
          user: toPublicUser(user),
          needsName: challenge.needsName || !user.name,
        },
      })
      setSessionCookie(response, jwt)
      return response
    } catch (error) {
      return fail(sanitizeError(error, 'تأیید کد ناموفق بود'), 400)
    }
  })
}
