import {
  fail,
  getClientIp,
  maskPhone,
  ok,
  readJson,
  sanitizeError,
  withApiHandler,
} from '@/server/api'
import { requestOtp } from '@/server/auth/otp'
import { toLocalDisplay } from '@/server/phone'

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const body = await readJson<{ phone?: string }>(request)
    if (!body?.phone) return fail('phone is required')

    try {
      const result = await requestOtp(body.phone, getClientIp(request))
      const local = toLocalDisplay(body.phone)
      return ok({
        expiresAt: result.expiresAt.toISOString(),
        cooldownSeconds: result.cooldownSeconds,
        destinationMasked: maskPhone(local),
      })
    } catch (error) {
      return fail(sanitizeError(error, 'ارسال کد تأیید ممکن نشد'), 400)
    }
  })
}
