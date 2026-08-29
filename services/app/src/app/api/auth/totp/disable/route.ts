import {
  fail,
  ok,
  readJson,
  sanitizeError,
  withApiHandler,
} from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import { disableTotp } from '@/server/auth/totp'

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = await readJson<{ code?: string }>(request)
    if (!body?.code) return fail('code is required')

    try {
      const user = await requireUser(request)
      const status = await disableTotp(user.id, body.code)
      return ok(status)
    } catch (error) {
      if (error instanceof Response) return error
      return fail(sanitizeError(error, 'غیرفعال‌سازی ناموفق بود'), 400)
    }
  })
}
