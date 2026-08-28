import type { Attachment } from '@/features/cases/types'
import { query } from '../db'
import { mapAttachment } from '../mappers'
import { sanitizeFileName, validateAttachmentMeta } from '../storage/config'
import { assertStorageQuota } from '../storage/quota'
import {
  buildStorageKey,
  deleteObject,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
  objectExists,
} from '../storage/rustfs'
import { env } from '../env'

async function waitForObject(
  storageKey: string,
  attempts = 6,
  delayMs = 200
): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await objectExists(storageKey)) return true
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  return false
}

export type AttachmentRow = {
  id: string
  case_id: string | null
  client_id: string | null
  name: string
  mime_type: string
  size_bytes: string
  status: string
  storage_key: string | null
  uploaded_by: string | null
  created_at: Date
  comment_id: string | null
  seen_by_lawyer_at: Date | null
}

type InitInput = {
  name: string
  mimeType: string
  size: number
  uploadedBy: string
}

export type InitAttachmentResult = {
  attachment: Attachment
  uploadUrl: string
}

async function getAttachmentRow(
  attachmentId: string
): Promise<AttachmentRow | null> {
  const { rows } = await query<AttachmentRow>(
    `SELECT * FROM attachments WHERE id = $1 LIMIT 1`,
    [attachmentId]
  )
  return rows[0] ?? null
}

async function assertLawyerCaseAccess(
  ownerId: string,
  caseId: string
): Promise<boolean> {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM cases WHERE id = $1 AND owner_id = $2 LIMIT 1`,
    [caseId, ownerId]
  )
  return Boolean(rows[0])
}

async function assertClientCaseAccess(
  clientUserId: string,
  caseId: string
): Promise<{ ok: boolean; ownerId?: string }> {
  const { rows } = await query<{ owner_id: string }>(
    `SELECT owner_id FROM cases WHERE id = $1 AND client_user_id = $2 LIMIT 1`,
    [caseId, clientUserId]
  )
  const row = rows[0]
  if (!row) return { ok: false }
  return { ok: true, ownerId: row.owner_id }
}

async function assertLawyerClientAccess(
  ownerId: string,
  clientId: string
): Promise<boolean> {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM clients WHERE id = $1 AND owner_id = $2 LIMIT 1`,
    [clientId, ownerId]
  )
  return Boolean(rows[0])
}

function validateInit(input: InitInput): void {
  const err = validateAttachmentMeta({
    name: input.name,
    mimeType: input.mimeType,
    size: input.size,
    maxBytes: env.RUSTFS_MAX_FILE_BYTES,
  })
  if (err) throw new Error(err)
}

async function finalizeInitAttachment(
  row: AttachmentRow,
  storageKey: string,
  mimeType: string
): Promise<InitAttachmentResult> {
  await query(`UPDATE attachments SET storage_key = $1 WHERE id = $2`, [
    storageKey,
    row.id,
  ])

  try {
    const uploadUrl = await getPresignedUploadUrl(storageKey, mimeType)
    return { attachment: mapAttachment(row), uploadUrl }
  } catch (error) {
    await query(`DELETE FROM attachments WHERE id = $1`, [row.id])
    throw error
  }
}

export async function initCaseAttachment(
  ownerId: string,
  caseId: string,
  input: InitInput
): Promise<InitAttachmentResult | null> {
  validateInit(input)
  await assertStorageQuota(input.size)
  if (!(await assertLawyerCaseAccess(ownerId, caseId))) return null

  const fileName = sanitizeFileName(input.name)
  const { rows } = await query<AttachmentRow>(
    `INSERT INTO attachments (case_id, name, mime_type, size_bytes, uploaded_by, status)
     VALUES ($1,$2,$3,$4,$5,'processing')
     RETURNING *`,
    [caseId, fileName, input.mimeType, input.size, input.uploadedBy]
  )
  const row = rows[0]!
  const storageKey = buildStorageKey({
    ownerId,
    scope: 'cases',
    parentId: caseId,
    attachmentId: row.id,
    fileName,
  })

  return finalizeInitAttachment(row, storageKey, input.mimeType)
}

export async function initClientAttachment(
  ownerId: string,
  clientId: string,
  input: InitInput
): Promise<InitAttachmentResult | null> {
  validateInit(input)
  await assertStorageQuota(input.size)
  if (!(await assertLawyerClientAccess(ownerId, clientId))) return null

  const fileName = sanitizeFileName(input.name)
  const { rows } = await query<AttachmentRow>(
    `INSERT INTO attachments (client_id, name, mime_type, size_bytes, uploaded_by, status)
     VALUES ($1,$2,$3,$4,$5,'processing')
     RETURNING *`,
    [clientId, fileName, input.mimeType, input.size, input.uploadedBy]
  )
  const row = rows[0]!
  const storageKey = buildStorageKey({
    ownerId,
    scope: 'clients',
    parentId: clientId,
    attachmentId: row.id,
    fileName,
  })

  return finalizeInitAttachment(row, storageKey, input.mimeType)
}

export async function initPortalCaseDocument(
  clientUserId: string,
  caseId: string,
  input: InitInput
): Promise<InitAttachmentResult | null> {
  validateInit(input)
  await assertStorageQuota(input.size)
  const access = await assertClientCaseAccess(clientUserId, caseId)
  if (!access.ok || !access.ownerId) return null

  const fileName = sanitizeFileName(input.name)
  const { rows } = await query<AttachmentRow>(
    `INSERT INTO attachments (case_id, name, mime_type, size_bytes, uploaded_by, status)
     VALUES ($1,$2,$3,$4,$5,'processing')
     RETURNING *`,
    [caseId, fileName, input.mimeType, input.size, input.uploadedBy]
  )
  const row = rows[0]!
  const storageKey = buildStorageKey({
    ownerId: access.ownerId,
    scope: 'cases',
    parentId: caseId,
    attachmentId: row.id,
    fileName,
  })

  return finalizeInitAttachment(row, storageKey, input.mimeType)
}

async function canAccessAttachment(
  userId: string,
  role: string,
  row: AttachmentRow
): Promise<boolean> {
  if (role === 'super_admin') return true

  if (row.case_id) {
    if (role === 'lawyer') {
      return assertLawyerCaseAccess(userId, row.case_id)
    }
    if (role === 'client') {
      const access = await assertClientCaseAccess(userId, row.case_id)
      return access.ok
    }
  }

  if (row.client_id && role === 'lawyer') {
    return assertLawyerClientAccess(userId, row.client_id)
  }

  return false
}

export async function completeAttachment(
  attachmentId: string,
  userId: string,
  role: 'lawyer' | 'super_admin' | 'client'
): Promise<Attachment | null> {
  const row = await getAttachmentRow(attachmentId)
  if (!row?.storage_key) return null

  const allowed = await canAccessAttachment(userId, role, row)
  if (!allowed) return null

  const exists = await waitForObject(row.storage_key)
  if (!exists) {
    await query(`DELETE FROM attachments WHERE id = $1`, [attachmentId])
    throw new Error('فایل در ذخیره‌سازی یافت نشد. دوباره آپلود کنید.')
  }

  const { rows } = await query<AttachmentRow>(
    `UPDATE attachments SET status = 'available'
     WHERE id = $1
     RETURNING *`,
    [attachmentId]
  )
  return rows[0] ? mapAttachment(rows[0]) : null
}

export async function getAttachmentDownloadUrl(
  attachmentId: string,
  userId: string,
  role: 'lawyer' | 'super_admin' | 'client'
): Promise<{ url: string; name: string } | null> {
  const row = await getAttachmentRow(attachmentId)
  if (!row?.storage_key || row.status !== 'available') return null

  const allowed = await canAccessAttachment(userId, role, row)
  if (!allowed) return null

  const url = await getPresignedDownloadUrl(
    row.storage_key,
    row.name,
    row.mime_type
  )
  return { url, name: row.name }
}

export async function deleteAttachmentWithObject(
  attachmentId: string,
  userId: string,
  role: 'lawyer' | 'super_admin' | 'client'
): Promise<boolean> {
  const row = await getAttachmentRow(attachmentId)
  if (!row) return false

  const allowed = await canAccessAttachment(userId, role, row)
  if (!allowed) return false

  if (role === 'client') {
    if (row.uploaded_by !== userId) {
      throw new Error('فقط فایل‌های خودتان قابل حذف است.')
    }
    if (row.seen_by_lawyer_at) {
      throw new Error('پس از مشاهده توسط وکیل، حذف فایل امکان‌پذیر نیست.')
    }
    if (row.comment_id) {
      const { rows: parentRows } = await query<{
        author_id: string | null
        seen_by_lawyer_at: Date | null
      }>(
        `SELECT author_id, seen_by_lawyer_at FROM case_comments WHERE id = $1 LIMIT 1`,
        [row.comment_id]
      )
      const parent = parentRows[0]
      if (!parent || parent.author_id !== userId) {
        throw new Error('فقط فایل‌های خودتان قابل حذف است.')
      }
      if (parent.seen_by_lawyer_at) {
        throw new Error('پس از مشاهده توسط وکیل، حذف فایل امکان‌پذیر نیست.')
      }
    }
  }

  if (row.storage_key) {
    try {
      await deleteObject(row.storage_key)
    } catch {
      // Continue DB delete even if object missing
    }
  }

  const { rowCount } = await query(`DELETE FROM attachments WHERE id = $1`, [
    attachmentId,
  ])
  return (rowCount ?? 0) > 0
}

export async function linkAttachmentsToComment(
  clientUserId: string,
  caseId: string,
  commentId: string,
  attachmentIds: string[]
): Promise<void> {
  if (attachmentIds.length === 0) return
  const access = await assertClientCaseAccess(clientUserId, caseId)
  if (!access.ok) throw new Error('دسترسی مجاز نیست.')

  await query(
    `UPDATE attachments
     SET comment_id = $1, status = 'available'
     WHERE id = ANY($2::uuid[])
       AND case_id = $3
       AND uploaded_by = $4
       AND status IN ('processing', 'available')`,
    [commentId, attachmentIds, caseId, clientUserId]
  )
}

export async function adminDeleteAttachment(
  attachmentId: string,
  requesterId: string,
  requesterRole: string
): Promise<boolean> {
  if (requesterRole === 'super_admin') {
    return deleteAttachmentWithObject(attachmentId, requesterId, 'super_admin')
  }
  if (requesterRole === 'lawyer') {
    const row = await getAttachmentRow(attachmentId)
    if (!row) return false
    if (row.case_id) {
      if (!(await assertLawyerCaseAccess(requesterId, row.case_id))) return false
    } else if (row.client_id) {
      if (!(await assertLawyerClientAccess(requesterId, row.client_id)))
        return false
    } else {
      return false
    }
    return deleteAttachmentWithObject(attachmentId, requesterId, 'lawyer')
  }
  return false
}
