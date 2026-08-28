import { generateSessionToken, hashToken } from '../crypto'
import { query } from '../db'
import type { User, UserRole } from '../types'
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from './constants'
import { signSessionJwt, verifySessionJwt } from './jwt'

export { SESSION_COOKIE, SESSION_TTL_SECONDS }

export type SessionMeta = {
  userAgent?: string | null
  ipAddress?: string | null
  role?: UserRole
}

const USER_COLUMNS = `
  u.id, u.phone, u.name, u.email, u.role, u.avatar_url,
  u.title, u.specialty, u.bar_number, u.is_active,
  u.created_at, u.updated_at
`

/**
 * Creates a DB session row and returns a signed JWT cookie value.
 * JWT carries userId/role for Edge middleware; `sid` maps to token_hash for revocation.
 */
export async function createSession(
  userId: string,
  meta: SessionMeta = {}
): Promise<string> {
  const sid = generateSessionToken()
  const tokenHash = hashToken(sid)
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)

  let role = meta.role
  if (!role) {
    const { rows } = await query<Pick<User, 'role'>>(
      `SELECT role FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    )
    role = rows[0]?.role
  }
  if (!role) {
    throw new Error('User not found for session')
  }

  await query(
    `INSERT INTO auth_sessions (user_id, token_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      userId,
      tokenHash,
      meta.userAgent ?? null,
      meta.ipAddress ?? null,
      expiresAt.toISOString(),
    ]
  )

  return signSessionJwt({
    userId,
    role,
    sid,
    expiresAt,
  })
}

export async function revokeSession(jwtOrToken: string): Promise<void> {
  const claims = await verifySessionJwt(jwtOrToken)
  const sid = claims?.sid ?? jwtOrToken
  const tokenHash = hashToken(sid)
  await query(
    `UPDATE auth_sessions
     SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash]
  )
}

/** Verifies JWT then confirms session is active in DB. */
export async function getSessionUser(jwt: string): Promise<User | null> {
  if (!jwt) return null

  const claims = await verifySessionJwt(jwt)
  if (!claims) return null

  const tokenHash = hashToken(claims.sid)
  const { rows } = await query<User>(
    `SELECT ${USER_COLUMNS}
     FROM auth_sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.revoked_at IS NULL
       AND s.expires_at > NOW()
       AND u.is_active = TRUE
     LIMIT 1`,
    [tokenHash]
  )

  return rows[0] ?? null
}
