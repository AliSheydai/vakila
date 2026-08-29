import { query } from '../db'
import type { MessengerPlatform } from './settings-repo'
import type { User, UserRole } from '../types'

export type MessengerLink = {
  id: string
  platform: MessengerPlatform
  chatId: string
  userId: string
  phone: string
  linkedAt: string
  revokedAt: string | null
  lastSeenAt: string
}

type LinkRow = {
  id: string
  platform: MessengerPlatform
  chat_id: string
  user_id: string
  phone: string
  linked_at: Date | string
  revoked_at: Date | string | null
  last_seen_at: Date | string
}

type UserRow = {
  id: string
  phone: string
  name: string | null
  email: string | null
  role: UserRole
  avatar_url: string | null
  title: string | null
  specialty: string | null
  bar_number: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value)
}

function mapLink(row: LinkRow): MessengerLink {
  return {
    id: row.id,
    platform: row.platform,
    chatId: row.chat_id,
    userId: row.user_id,
    phone: row.phone,
    linkedAt: toIso(row.linked_at),
    revokedAt: row.revoked_at ? toIso(row.revoked_at) : null,
    lastSeenAt: toIso(row.last_seen_at),
  }
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar_url: row.avatar_url,
    title: row.title,
    specialty: row.specialty,
    bar_number: row.bar_number,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getActiveLinkByChat(
  platform: MessengerPlatform,
  chatId: string
): Promise<(MessengerLink & { user: User }) | null> {
  const { rows } = await query<LinkRow & { u_id: string }>(
    `SELECT ml.id, ml.platform, ml.chat_id, ml.user_id, ml.phone,
            ml.linked_at, ml.revoked_at, ml.last_seen_at
     FROM messenger_links ml
     WHERE ml.platform = $1
       AND ml.chat_id = $2
       AND ml.revoked_at IS NULL
     LIMIT 1`,
    [platform, chatId]
  )

  const linkRow = rows[0]
  if (!linkRow) return null

  const { rows: userRows } = await query<UserRow>(
    `SELECT id, phone, name, email, role, avatar_url, title, specialty,
            bar_number, is_active, created_at, updated_at
     FROM users WHERE id = $1 LIMIT 1`,
    [linkRow.user_id]
  )
  const userRow = userRows[0]
  if (!userRow || !userRow.is_active) return null

  return { ...mapLink(linkRow), user: mapUser(userRow) }
}

export async function getActiveLinkByUser(
  platform: MessengerPlatform,
  userId: string
): Promise<MessengerLink | null> {
  const { rows } = await query<LinkRow>(
    `SELECT id, platform, chat_id, user_id, phone, linked_at, revoked_at, last_seen_at
     FROM messenger_links
     WHERE platform = $1
       AND user_id = $2
       AND revoked_at IS NULL
     ORDER BY linked_at DESC
     LIMIT 1`,
    [platform, userId]
  )
  const row = rows[0]
  return row ? mapLink(row) : null
}

export async function linkChatToUser(input: {
  platform: MessengerPlatform
  chatId: string
  userId: string
  phone: string
}): Promise<MessengerLink> {
  await query(
    `UPDATE messenger_links
     SET revoked_at = NOW()
     WHERE platform = $1
       AND revoked_at IS NULL
       AND (chat_id = $2 OR user_id = $3)`,
    [input.platform, input.chatId, input.userId]
  )

  const { rows } = await query<LinkRow>(
    `INSERT INTO messenger_links (platform, chat_id, user_id, phone)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (platform, chat_id) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       phone = EXCLUDED.phone,
       linked_at = NOW(),
       revoked_at = NULL,
       last_seen_at = NOW()
     RETURNING id, platform, chat_id, user_id, phone, linked_at, revoked_at, last_seen_at`,
    [input.platform, input.chatId, input.userId, input.phone]
  )

  return mapLink(rows[0]!)
}

export async function revokeLink(
  platform: MessengerPlatform,
  chatId: string
): Promise<void> {
  await query(
    `UPDATE messenger_links
     SET revoked_at = NOW()
     WHERE platform = $1 AND chat_id = $2 AND revoked_at IS NULL`,
    [platform, chatId]
  )
}

export async function touchLink(
  platform: MessengerPlatform,
  chatId: string
): Promise<void> {
  await query(
    `UPDATE messenger_links
     SET last_seen_at = NOW()
     WHERE platform = $1 AND chat_id = $2 AND revoked_at IS NULL`,
    [platform, chatId]
  )
}
