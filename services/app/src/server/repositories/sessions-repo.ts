import { query } from '../db'
import type { AuthSessionRow } from '../types'

export async function listActiveSessions(
  userId: string
): Promise<AuthSessionRow[]> {
  const { rows } = await query<AuthSessionRow>(
    `SELECT id, user_id, token_hash, user_agent, ip_address, expires_at, revoked_at, created_at
     FROM auth_sessions
     WHERE user_id = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId]
  )
  return rows
}

export async function revokeSessionById(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const { rowCount } = await query(
    `UPDATE auth_sessions
     SET revoked_at = NOW()
     WHERE id = $1
       AND user_id = $2
       AND revoked_at IS NULL`,
    [sessionId, userId]
  )
  return (rowCount ?? 0) > 0
}

export async function revokeOtherSessions(
  userId: string,
  currentTokenHash: string
): Promise<number> {
  const { rowCount } = await query(
    `UPDATE auth_sessions
     SET revoked_at = NOW()
     WHERE user_id = $1
       AND token_hash != $2
       AND revoked_at IS NULL
       AND expires_at > NOW()`,
    [userId, currentTokenHash]
  )
  return rowCount ?? 0
}
