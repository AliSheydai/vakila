import { generateOtp, hashToken, timingSafeEqualHex } from '../crypto'
import { query, withTransaction } from '../db'
import { getEnv } from '../env'
import { sendOtpViaFerzz } from '../ferzz'
import { isValidIranianMobile, toFerzzDestination, toLocalDisplay } from '../phone'
import { ensureCrmClientForPortalUser } from '../repositories/clients-repo'
import type { OtpChallengeRow, User } from '../types'

export type RequestOtpResult = {
  expiresAt: Date
  cooldownSeconds: number
}

export type VerifyOtpResult = {
  user: User
  needsName: boolean
  isNew: boolean
}

function normalizeStoredPhone(phone: string): string {
  return toLocalDisplay(phone)
}

export async function requestOtp(
  phone: string,
  ip?: string | null
): Promise<RequestOtpResult> {
  if (!isValidIranianMobile(phone)) {
    throw new Error('شماره موبایل معتبر نیست.')
  }

  const env = getEnv()
  const storedPhone = normalizeStoredPhone(phone)
  const destination = toFerzzDestination(phone)

  const { rows: recent } = await query<OtpChallengeRow>(
    `SELECT * FROM otp_challenges
     WHERE phone = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [storedPhone]
  )

  const last = recent[0]
  if (last) {
    const elapsedMs = Date.now() - new Date(last.created_at).getTime()
    const cooldownMs = env.OTP_COOLDOWN_SECONDS * 1000
    if (elapsedMs < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - elapsedMs) / 1000)
      throw new Error(
        `لطفاً ${remaining} ثانیه صبر کنید و دوباره درخواست دهید.`
      )
    }
  }

  const code = generateOtp(env.OTP_LENGTH)
  const codeHash = hashToken(code)
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRE_MINUTES * 60 * 1000)

  await query(
    `INSERT INTO otp_challenges (phone, code_hash, expires_at, ip_address)
     VALUES ($1, $2, $3, $4)`,
    [storedPhone, codeHash, expiresAt.toISOString(), ip ?? null]
  )

  if (env.NODE_ENV === 'development' && env.FERZZ_DEV_BYPASS) {
    console.log(`[OTP bypass] phone=${storedPhone} code=${code}`)
  } else {
    await sendOtpViaFerzz({ destination, code })
  }

  return {
    expiresAt,
    cooldownSeconds: env.OTP_COOLDOWN_SECONDS,
  }
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<VerifyOtpResult> {
  if (!isValidIranianMobile(phone)) {
    throw new Error('شماره موبایل معتبر نیست.')
  }

  const storedPhone = normalizeStoredPhone(phone)
  const codeHash = hashToken(code.trim())

  return withTransaction(async (client) => {
    const { rows: challenges } = await client.query<OtpChallengeRow>(
      `SELECT * FROM otp_challenges
       WHERE phone = $1
         AND consumed_at IS NULL
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [storedPhone]
    )

    const challenge = challenges[0]
    if (!challenge) {
      throw new Error('کد تأیید منقضی شده یا یافت نشد.')
    }

    if (challenge.attempts >= challenge.max_attempts) {
      throw new Error('تعداد تلاش بیش از حد است. کد جدید درخواست کنید.')
    }

    await client.query(
      `UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = $1`,
      [challenge.id]
    )

    if (!timingSafeEqualHex(challenge.code_hash.trim(), codeHash)) {
      throw new Error('کد تأیید نادرست است.')
    }

    await client.query(
      `UPDATE otp_challenges SET consumed_at = NOW() WHERE id = $1`,
      [challenge.id]
    )

    const { rows: existingUsers } = await client.query<User>(
      `SELECT * FROM users WHERE phone = $1 LIMIT 1`,
      [storedPhone]
    )

    let user = existingUsers[0]
    let isNew = false

    if (user) {
      if (!user.is_active) {
        throw new Error('این حساب غیرفعال است.')
      }
    } else {
      // قفل تراکنش: فقط یک ثبت‌نام همزمان می‌تواند نقش اولین کاربر را بگیرد
      await client.query(`SELECT pg_advisory_xact_lock(847291)`)

      const { rows: adminRows } = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM users`
      )
      const totalUsers = Number(adminRows[0]?.count ?? 0)
      // اولین کاربر سیستم = وکیل مدیرکل
      const role = totalUsers === 0 ? 'super_admin' : 'client'

      const { rows: created } = await client.query<User>(
        `INSERT INTO users (phone, role)
         VALUES ($1, $2)
         RETURNING *`,
        [storedPhone, role]
      )
      user = created[0]!
      isNew = true
    }

    return {
      user,
      needsName: !user.name,
      isNew,
    }
  }).then(async (result) => {
    if (result.user.role === 'client') {
      await ensureCrmClientForPortalUser(result.user)
    }
    return result
  })
}
