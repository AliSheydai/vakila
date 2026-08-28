import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from '@/features/cases/types'
import { query } from '../db'
import { mapAttachment, mapClient } from '../mappers'
import * as notificationService from '../services/notification-service'
import { toLocalDisplay } from '../phone'
import type { ClientRow } from '../types'

type PortalUserRef = {
  id: string
  phone: string
  name: string | null
  email?: string | null
}

export async function getDefaultLawyerId(): Promise<string | null> {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM users
     WHERE role IN ('lawyer', 'super_admin') AND is_active = TRUE
     ORDER BY CASE WHEN role = 'super_admin' THEN 0 ELSE 1 END, created_at ASC
     LIMIT 1`
  )
  return rows[0]?.id ?? null
}

/** Ensures a lawyer CRM row exists for a portal-registered client user. */
export async function ensureCrmClientForPortalUser(
  user: PortalUserRef,
  ownerId?: string
): Promise<string | null> {
  const lawyerId = ownerId ?? (await getDefaultLawyerId())
  if (!lawyerId) return null

  const phone = toLocalDisplay(user.phone)
  const { rows: existing } = await query<{ id: string }>(
    `SELECT id FROM clients
     WHERE owner_id = $1 AND (linked_user_id = $2 OR phone = $3)
     LIMIT 1`,
    [lawyerId, user.id, phone]
  )

  if (existing[0]) {
    await query(
      `UPDATE clients
       SET linked_user_id = COALESCE(linked_user_id, $1),
           name = CASE WHEN $2::boolean THEN $3 ELSE name END
       WHERE id = $4`,
      [user.id, Boolean(user.name?.trim()), user.name?.trim() ?? null, existing[0].id]
    )
    return existing[0].id
  }

  const { rows: created } = await query<{ id: string }>(
    `INSERT INTO clients (owner_id, linked_user_id, name, phone, email)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id`,
    [
      lawyerId,
      user.id,
      user.name?.trim() || 'موکل',
      phone,
      user.email?.trim() || null,
    ]
  )
  return created[0]?.id ?? null
}

async function syncPortalClientsForOwner(ownerId: string): Promise<void> {
  await query(
    `INSERT INTO clients (owner_id, linked_user_id, name, phone, email)
     SELECT DISTINCT $1, u.id, COALESCE(NULLIF(TRIM(u.name), ''), 'موکل'), u.phone, u.email
     FROM users u
     INNER JOIN cases c ON c.client_user_id = u.id AND c.owner_id = $1
     WHERE u.role = 'client' AND u.is_active = TRUE
     AND NOT EXISTS (
       SELECT 1 FROM clients cl
       WHERE cl.owner_id = $1 AND (cl.linked_user_id = u.id OR cl.phone = u.phone)
     )`,
    [ownerId]
  )

  const defaultLawyerId = await getDefaultLawyerId()
  if (defaultLawyerId !== ownerId) return

  await query(
    `INSERT INTO clients (owner_id, linked_user_id, name, phone, email)
     SELECT $1, u.id, COALESCE(NULLIF(TRIM(u.name), ''), 'موکل'), u.phone, u.email
     FROM users u
     WHERE u.role = 'client' AND u.is_active = TRUE
     AND NOT EXISTS (SELECT 1 FROM clients cl WHERE cl.linked_user_id = u.id)
     AND NOT EXISTS (
       SELECT 1 FROM clients cl
       WHERE cl.owner_id = $1 AND cl.phone = u.phone
     )`,
    [ownerId]
  )
}

async function attachmentsForClient(clientId: string) {
  const { rows } = await query<{
    id: string
    name: string
    mime_type: string
    size_bytes: string
    created_at: Date
    uploaded_by: string | null
  }>(
    `SELECT id, name, mime_type, size_bytes, created_at, uploaded_by
     FROM attachments WHERE client_id = $1 ORDER BY created_at DESC`,
    [clientId]
  )
  return rows.map(mapAttachment)
}

export async function listClients(ownerId: string): Promise<Client[]> {
  await syncPortalClientsForOwner(ownerId)

  const { rows } = await query<ClientRow>(
    `SELECT * FROM clients WHERE owner_id = $1 ORDER BY created_at DESC`,
    [ownerId]
  )
  const result: Client[] = []
  for (const row of rows) {
    const attachments = await attachmentsForClient(row.id)
    result.push(mapClient(row, attachments))
  }
  return result
}

export async function getClient(
  ownerId: string,
  id: string
): Promise<Client | null> {
  const { rows } = await query<ClientRow>(
    `SELECT * FROM clients WHERE id = $1 AND owner_id = $2 LIMIT 1`,
    [id, ownerId]
  )
  const row = rows[0]
  if (!row) return null
  return mapClient(row, await attachmentsForClient(row.id))
}

export async function createClient(
  ownerId: string,
  input: CreateClientInput
): Promise<Client> {
  const phone = toLocalDisplay(input.phone)
  const { rows: linked } = await query<{ id: string }>(
    `SELECT id FROM users WHERE phone = $1 LIMIT 1`,
    [phone]
  )

  const { rows } = await query<ClientRow>(
    `INSERT INTO clients (
       owner_id, linked_user_id, name, phone, email,
       citizenship, national_id, avatar_data_url, notes
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      ownerId,
      linked[0]?.id ?? null,
      input.name.trim(),
      phone,
      input.email?.trim() || null,
      input.citizenship ?? null,
      input.nationalId?.trim() || null,
      input.avatarDataUrl ?? null,
      input.notes?.trim() || null,
    ]
  )
  return mapClient(rows[0]!, [])
}

export async function updateClient(
  ownerId: string,
  id: string,
  input: UpdateClientInput
): Promise<Client | null> {
  const existing = await getClient(ownerId, id)
  if (!existing) return null

  const phone =
    input.phone !== undefined ? toLocalDisplay(input.phone) : existing.phone

  let linkedUserId: string | null = null
  if (input.phone !== undefined) {
    const { rows: linked } = await query<{ id: string }>(
      `SELECT id FROM users WHERE phone = $1 LIMIT 1`,
      [phone]
    )
    linkedUserId = linked[0]?.id ?? null
  }

  const { rows } = await query<ClientRow>(
    `UPDATE clients SET
       name = COALESCE($3, name),
       phone = COALESCE($4, phone),
       email = CASE WHEN $5::boolean THEN $6 ELSE email END,
       citizenship = CASE WHEN $7::boolean THEN $8 ELSE citizenship END,
       national_id = CASE WHEN $9::boolean THEN $10 ELSE national_id END,
       avatar_data_url = CASE WHEN $11::boolean THEN $12 ELSE avatar_data_url END,
       notes = CASE WHEN $13::boolean THEN $14 ELSE notes END,
       linked_user_id = CASE WHEN $15::boolean THEN $16 ELSE linked_user_id END
     WHERE id = $1 AND owner_id = $2
     RETURNING *`,
    [
      id,
      ownerId,
      input.name?.trim() ?? null,
      input.phone !== undefined ? phone : null,
      input.email !== undefined,
      input.email?.trim() || null,
      input.citizenship !== undefined,
      input.citizenship ?? null,
      input.nationalId !== undefined,
      input.nationalId?.trim() || null,
      input.avatarDataUrl !== undefined,
      input.avatarDataUrl,
      input.notes !== undefined,
      input.notes?.trim() || null,
      input.phone !== undefined,
      linkedUserId,
    ]
  )
  const row = rows[0]
  if (!row) return null

  const changed =
    row.name !== existing.name ||
    row.phone !== existing.phone ||
    (row.email ?? '') !== (existing.email ?? '') ||
    (row.citizenship ?? null) !== (existing.citizenship ?? null) ||
    (row.national_id ?? '') !== (existing.nationalId ?? '') ||
    (row.avatar_data_url ?? '') !== (existing.avatarDataUrl ?? '') ||
    (row.notes ?? '') !== (existing.notes ?? '')

  if (changed && row.linked_user_id) {
    await notificationService.notifyClientInfoUpdated({
      linkedUserId: row.linked_user_id,
      actorId: ownerId,
      clientId: row.id,
    })
  }

  return mapClient(row, await attachmentsForClient(row.id))
}

export async function deleteClient(
  ownerId: string,
  id: string
): Promise<boolean> {
  const { rowCount } = await query(
    `DELETE FROM clients WHERE id = $1 AND owner_id = $2`,
    [id, ownerId]
  )
  return (rowCount ?? 0) > 0
}
