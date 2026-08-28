import { query } from '../db'
import { toPublicUser, type PublicUser } from '../serialize'
import type { User, UserRole } from '../types'

export async function listUsers(): Promise<PublicUser[]> {
  const { rows } = await query<User>(
    `SELECT * FROM users ORDER BY created_at DESC`
  )
  return rows.map(toPublicUser)
}

export async function updateUserRole(
  actorId: string,
  userId: string,
  role: UserRole
): Promise<PublicUser> {
  const { rows: targetRows } = await query<User>(
    `SELECT * FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  )
  const target = targetRows[0]
  if (!target) throw new Error('User not found')

  if (target.role === 'super_admin' && role !== 'super_admin') {
    const { rows: counts } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM users
       WHERE role = 'super_admin' AND is_active = TRUE`
    )
    if (Number(counts[0]?.count ?? 0) <= 1) {
      throw new Error('Cannot demote the last super_admin')
    }
  }

  const { rows } = await query<User>(
    `UPDATE users SET role = $1 WHERE id = $2 RETURNING *`,
    [role, userId]
  )
  return toPublicUser(rows[0]!)
}

export async function updateUserProfile(
  userId: string,
  name: string
): Promise<User> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Name is required')
  if (trimmed.length > 30) throw new Error('Name must be at most 30 characters')

  const { rows } = await query<User>(
    `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [trimmed, userId]
  )
  if (!rows[0]) throw new Error('User not found')
  return rows[0]
}

export async function updateUserName(
  userId: string,
  name: string
): Promise<User> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Name is required')

  const { rows: existing } = await query<User>(
    `SELECT * FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  )
  const user = existing[0]
  if (!user) throw new Error('User not found')
  if (user.name) {
    throw new Error('Profile name already set')
  }

  const { rows } = await query<User>(
    `UPDATE users SET name = $1 WHERE id = $2 AND (name IS NULL OR name = '')
     RETURNING *`,
    [trimmed, userId]
  )
  if (!rows[0]) throw new Error('Profile name already set')
  return rows[0]
}
