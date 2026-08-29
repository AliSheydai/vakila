import {
  fail,
  ok,
  sanitizeError,
  withApiHandler,
} from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import { startTotpSetup } from '@/server/auth/totp'

export async function POST(request: Request) {
  return withApiHandler(async () => {
    try {
      const user = await requireUser(request)
      const setup = await startTotpSetup(user)
      return ok(setup)
    } catch (error) {
      if (error instanceof Response) return error
      return fail(sanitizeError(error, 'شروع فعال‌سازی ناموفق بود'), 400)
    }
  })
}
