import {
  fail,
  ok,
  sanitizeError,
  withApiHandler,
} from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import { getTotpStatus } from '@/server/auth/totp'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    try {
      const user = await requireUser(request)
      const status = await getTotpStatus(user.id)
      return ok(status)
    } catch (error) {
      if (error instanceof Response) return error
      return fail(sanitizeError(error, 'دریافت وضعیت ورود دو مرحله‌ای ناموفق بود'), 400)
    }
  })
}
