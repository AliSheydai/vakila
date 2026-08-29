import {
  fail,
  ok,
  readJson,
  sanitizeError,
  withApiHandler,
} from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import { cancelTotpSetup, confirmTotpSetup } from '@/server/auth/totp'

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = await readJson<{ code?: string }>(request)
    if (!body?.code) return fail('code is required')

    try {
      const user = await requireUser(request)
      const status = await confirmTotpSetup(user.id, body.code)
      return ok(status)
    } catch (error) {
      if (error instanceof Response) return error
      return fail(sanitizeError(error, 'تأیید کد ناموفق بود'), 400)
    }
  })
}

export async function DELETE(request: Request) {
  return withApiHandler(async () => {
    try {
      const user = await requireUser(request)
      await cancelTotpSetup(user.id)
      return ok({ cancelled: true })
    } catch (error) {
      if (error instanceof Response) return error
      return fail(sanitizeError(error, 'لغو فعال‌سازی ناموفق بود'), 400)
    }
  })
}
