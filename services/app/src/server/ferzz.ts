import { getEnv } from './env'

export type SendOtpViaFerzzInput = {
  destination: string
  code: string
}

export async function sendOtpViaFerzz({
  destination,
  code,
}: SendOtpViaFerzzInput): Promise<void> {
  const env = getEnv()

  let response: Response
  try {
    response = await fetch(env.FERZZ_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: env.FERZZ_TOKEN,
        destination,
        action: env.FERZZ_ACTION,
        payload: {
          code,
          // برخی سرویس‌ها message را هم می‌پذیرند
          message: code,
        },
      }),
    })
  } catch {
    throw new Error('درگاه پیامک در دسترس نیست. لطفاً دوباره تلاش کنید.')
  }

  if (!response.ok) {
    throw new Error('ارسال کد تأیید ناموفق بود. لطفاً دوباره تلاش کنید.')
  }
}
