import { query } from '../db'
import { env } from '../env'

export type StorageUsageSummary = {
  limitBytes: number
  usedBytes: number
  usedPercent: number
  fileCount: number
}

export type UserStorageUsage = {
  userId: string
  userName: string | null
  userPhone: string
  userRole: string
  usedBytes: number
  fileCount: number
  usedPercent: number
}

export type StorageFileRow = {
  id: string
  name: string
  mimeType: string
  size: number
  uploadedAt: string
  uploadedBy: string | null
  uploadedByName: string | null
  caseId: string | null
  clientId: string | null
  caseTitle: string | null
  clientName: string | null
  status: string
}

export async function getStorageUsageSummary(): Promise<StorageUsageSummary> {
  const { rows } = await query<{ used: string; count: string }>(
    `SELECT COALESCE(SUM(size_bytes), 0)::text AS used,
            COUNT(*)::text AS count
     FROM attachments
     WHERE status = 'available' AND storage_key IS NOT NULL`
  )
  const usedBytes = Number(rows[0]?.used ?? 0)
  const fileCount = Number(rows[0]?.count ?? 0)
  const limitBytes = env.RUSTFS_STORAGE_LIMIT_BYTES
  const usedPercent =
    limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0

  return { limitBytes, usedBytes, usedPercent, fileCount }
}

export async function getPerUserStorageUsage(): Promise<UserStorageUsage[]> {
  const limitBytes = env.RUSTFS_STORAGE_LIMIT_BYTES
  const { rows } = await query<{
    user_id: string
    user_name: string | null
    user_phone: string
    user_role: string
    used: string
    count: string
  }>(
    `SELECT u.id AS user_id,
            u.name AS user_name,
            u.phone AS user_phone,
            u.role AS user_role,
            COALESCE(SUM(a.size_bytes), 0)::text AS used,
            COUNT(a.id)::text AS count
     FROM attachments a
     INNER JOIN users u ON u.id = a.uploaded_by
     WHERE a.status = 'available' AND a.storage_key IS NOT NULL
     GROUP BY u.id, u.name, u.phone, u.role
     ORDER BY SUM(a.size_bytes) DESC`
  )

  return rows.map((row) => {
    const usedBytes = Number(row.used)
    return {
      userId: row.user_id,
      userName: row.user_name,
      userPhone: row.user_phone,
      userRole: row.user_role,
      usedBytes,
      fileCount: Number(row.count),
      usedPercent:
        limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0,
    }
  })
}

export async function listStorageFiles(
  ownerId?: string
): Promise<StorageFileRow[]> {
  const params: unknown[] = []
  let ownerFilter = ''
  if (ownerId) {
    params.push(ownerId)
    ownerFilter = `AND (
      c.owner_id = $1 OR cl.owner_id = $1
    )`
  }

  const { rows } = await query<{
    id: string
    name: string
    mime_type: string
    size_bytes: string
    created_at: Date
    uploaded_by: string | null
    uploaded_by_name: string | null
    case_id: string | null
    client_id: string | null
    case_title: string | null
    client_name: string | null
    status: string
  }>(
    `SELECT a.id, a.name, a.mime_type, a.size_bytes, a.created_at,
            a.uploaded_by, u.name AS uploaded_by_name,
            a.case_id, a.client_id,
            c.title AS case_title, cl.name AS client_name,
            a.status
     FROM attachments a
     LEFT JOIN users u ON u.id = a.uploaded_by
     LEFT JOIN cases c ON c.id = a.case_id
     LEFT JOIN clients cl ON cl.id = a.client_id
     WHERE a.storage_key IS NOT NULL
     ${ownerFilter}
     ORDER BY a.created_at DESC
     LIMIT 500`,
    params
  )

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    size: Number(row.size_bytes),
    uploadedAt: row.created_at.toISOString(),
    uploadedBy: row.uploaded_by,
    uploadedByName: row.uploaded_by_name,
    caseId: row.case_id,
    clientId: row.client_id,
    caseTitle: row.case_title,
    clientName: row.client_name,
    status: row.status,
  }))
}

export async function assertStorageQuota(additionalBytes: number): Promise<void> {
  const { usedBytes } = await getStorageUsageSummary()
  const limit = env.RUSTFS_STORAGE_LIMIT_BYTES
  if (limit > 0 && usedBytes + additionalBytes > limit) {
    throw new Error(
      'فضای ذخیره‌سازی سیستم تکمیل شده است. لطفاً فایل‌های قدیمی را حذف کنید.'
    )
  }
}
