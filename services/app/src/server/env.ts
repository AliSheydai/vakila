import { z } from 'zod'

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    SESSION_SECRET: z.string().min(32),
    FERZZ_TOKEN: z.string().min(1),
    FERZZ_ENDPOINT: z.string().url().default('https://gateway.ferzz.ir/send'),
    FERZZ_ACTION: z.enum(['sms', 'flashcall']).default('sms'),
    FERZZ_DEV_BYPASS: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
    OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(5),
    OTP_EXPIRE_MINUTES: z.coerce.number().int().positive().default(5),
    OTP_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(60),
    APP_URL: z.string().url().default('http://localhost:4000'),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    COOKIE_SECURE: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
    PORT: z.coerce.number().int().positive().optional(),
  })
  .transform((data) => ({
    ...data,
    COOKIE_SECURE:
      data.COOKIE_SECURE ?? data.NODE_ENV === 'production',
    FERZZ_DEV_BYPASS: data.FERZZ_DEV_BYPASS ?? false,
  }))

export type Env = z.infer<typeof envSchema>

let cached: Env | null = null

export function getEnv(): Env {
  if (cached) return cached

  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid environment configuration: ${details}`)
  }

  cached = parsed.data
  return cached
}

/** Lazy typed env accessor — validates on first use. */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string | symbol) {
    const value = getEnv()
    return value[prop as keyof Env]
  },
})
