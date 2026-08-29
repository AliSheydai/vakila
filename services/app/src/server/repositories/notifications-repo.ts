import type {
  Notification,
  NotificationType,
  ClientUnseenActivity,
  CaseUnseenCount,
  CaseContentActivity,
} from '@/features/notifications/types'
import { query } from '../db'
import { mapNotification } from '../mappers'

type NotificationRow = {
  id: string
  recipient_id: string
  actor_id: string | null
  type: string
  title: string
  body: string
  href: string | null
  case_id: string | null
  client_id: string | null
  event_id: string | null
  read_at: Date | string | null
  created_at: Date | string
}

export type CreateNotificationInput = {
  recipientId: string
  actorId?: string | null
  type: NotificationType
  title: string
  body: string
  href?: string | null
  caseId?: string | null
  clientId?: string | null
  eventId?: string | null
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  const { rows } = await query<NotificationRow>(
    `INSERT INTO notifications (
       recipient_id, actor_id, type, title, body, href,
       case_id, client_id, event_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      input.recipientId,
      input.actorId ?? null,
      input.type,
      input.title.trim(),
      input.body.trim(),
      input.href ?? null,
      input.caseId ?? null,
      input.clientId ?? null,
      input.eventId ?? null,
    ]
  )
  return mapNotification(rows[0]!)
}

export async function listNotifications(
  recipientId: string,
  options?: {
    unreadOnly?: boolean
    limit?: number
    cursor?: string
  }
): Promise<Notification[]> {
  const parsedLimit = options?.limit
  const limit = parsedLimit
    ? Math.min(Math.max(1, Number(parsedLimit) || 50), 100)
    : 50
  const params: unknown[] = [recipientId]
  let where = 'recipient_id = $1'

  if (options?.unreadOnly) {
    where += ' AND read_at IS NULL'
  }

  if (options?.cursor) {
    params.push(options.cursor)
    where += ` AND created_at < (SELECT created_at FROM notifications WHERE id = $${params.length})`
  }

  params.push(limit)

  const { rows } = await query<NotificationRow>(
    `SELECT * FROM notifications
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length}`,
    params
  )
  return rows.map(mapNotification)
}

export async function countUnreadNotifications(
  recipientId: string
): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM notifications
     WHERE recipient_id = $1 AND read_at IS NULL`,
    [recipientId]
  )
  return Number(rows[0]?.count ?? 0)
}

export async function getNotification(
  recipientId: string,
  notificationId: string
): Promise<Notification | null> {
  const { rows } = await query<NotificationRow>(
    `SELECT * FROM notifications
     WHERE id = $1 AND recipient_id = $2
     LIMIT 1`,
    [notificationId, recipientId]
  )
  return rows[0] ? mapNotification(rows[0]) : null
}

export async function markNotificationRead(
  recipientId: string,
  notificationId: string
): Promise<Notification | null> {
  const { rows: updated } = await query<NotificationRow>(
    `UPDATE notifications
     SET read_at = NOW()
     WHERE id = $1 AND recipient_id = $2 AND read_at IS NULL
     RETURNING *`,
    [notificationId, recipientId]
  )
  if (updated[0]) return mapNotification(updated[0])

  const { rows: existing } = await query<NotificationRow>(
    `SELECT * FROM notifications WHERE id = $1 AND recipient_id = $2 LIMIT 1`,
    [notificationId, recipientId]
  )
  return existing[0] ? mapNotification(existing[0]) : null
}

export async function markAllNotificationsRead(
  recipientId: string
): Promise<number> {
  const { rowCount } = await query(
    `UPDATE notifications
     SET read_at = NOW()
     WHERE recipient_id = $1 AND read_at IS NULL`,
    [recipientId]
  )
  return rowCount ?? 0
}

export async function countUnreadByCase(
  recipientId: string
): Promise<CaseUnseenCount[]> {
  const { rows } = await query<{ case_id: string; count: string }>(
    `SELECT case_id, COUNT(*)::text AS count
     FROM notifications
     WHERE recipient_id = $1
       AND read_at IS NULL
       AND case_id IS NOT NULL
     GROUP BY case_id`,
    [recipientId]
  )
  return rows.map((row) => ({
    caseId: row.case_id,
    total: Number(row.count),
  }))
}

export async function listClientUnseenActivity(
  ownerId: string
): Promise<ClientUnseenActivity[]> {
  const { rows } = await query<{
    client_id: string
    comments: string
    documents: string
  }>(
    `WITH lawyer_cases AS (
       SELECT id, client_id, client_user_id
       FROM cases
       WHERE owner_id = $1 AND client_id IS NOT NULL
     ),
     unseen_comments AS (
       SELECT lc.client_id, COUNT(*)::int AS cnt
       FROM case_comments cc
       JOIN lawyer_cases lc ON lc.id = cc.case_id
       WHERE cc.author_role = 'client' AND cc.seen_by_lawyer_at IS NULL
       GROUP BY lc.client_id
     ),
     unseen_documents AS (
       SELECT lc.client_id, COUNT(*)::int AS cnt
       FROM attachments a
       JOIN lawyer_cases lc ON lc.id = a.case_id
       WHERE a.comment_id IS NULL
         AND a.uploaded_by = lc.client_user_id
         AND a.seen_by_lawyer_at IS NULL
         AND a.status = 'available'
       GROUP BY lc.client_id
     )
     SELECT
       COALESCE(uc.client_id, ud.client_id) AS client_id,
       COALESCE(uc.cnt, 0)::text AS comments,
       COALESCE(ud.cnt, 0)::text AS documents
     FROM unseen_comments uc
     FULL OUTER JOIN unseen_documents ud ON uc.client_id = ud.client_id
     WHERE COALESCE(uc.cnt, 0) + COALESCE(ud.cnt, 0) > 0`,
    [ownerId]
  )

  return rows.map((row) => {
    const comments = Number(row.comments)
    const documents = Number(row.documents)
    return {
      clientId: row.client_id,
      comments,
      documents,
      total: comments + documents,
    }
  })
}

export async function countUnseenClientDocuments(
  ownerId: string,
  caseId: string
): Promise<number | null> {
  const { rows: owned } = await query<{ client_user_id: string | null }>(
    `SELECT client_user_id FROM cases WHERE id = $1 AND owner_id = $2 LIMIT 1`,
    [caseId, ownerId]
  )
  const caseRow = owned[0]
  if (!caseRow?.client_user_id) return null

  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM attachments a
     WHERE a.case_id = $1
       AND a.comment_id IS NULL
       AND a.uploaded_by = $2
       AND a.seen_by_lawyer_at IS NULL
       AND a.status = 'available'`,
    [caseId, caseRow.client_user_id]
  )
  return Number(rows[0]?.count ?? 0)
}

export async function markNotificationsReadForCase(
  recipientId: string,
  caseId: string
): Promise<number> {
  const { rowCount } = await query(
    `UPDATE notifications
     SET read_at = NOW()
     WHERE recipient_id = $1 AND case_id = $2 AND read_at IS NULL`,
    [recipientId, caseId]
  )
  return rowCount ?? 0
}

export async function listCaseContentActivity(
  ownerId: string
): Promise<CaseContentActivity[]> {
  const { rows } = await query<{
    case_id: string
    comments: string
    documents: string
  }>(
    `WITH lawyer_cases AS (
       SELECT id, client_user_id
       FROM cases
       WHERE owner_id = $1
     ),
     unseen_comments AS (
       SELECT cc.case_id, COUNT(*)::int AS cnt
       FROM case_comments cc
       JOIN lawyer_cases lc ON lc.id = cc.case_id
       WHERE cc.author_role = 'client' AND cc.seen_by_lawyer_at IS NULL
       GROUP BY cc.case_id
     ),
     unseen_documents AS (
       SELECT a.case_id, COUNT(*)::int AS cnt
       FROM attachments a
       JOIN lawyer_cases lc ON lc.id = a.case_id
       WHERE a.comment_id IS NULL
         AND a.uploaded_by = lc.client_user_id
         AND a.seen_by_lawyer_at IS NULL
         AND a.status = 'available'
       GROUP BY a.case_id
     )
     SELECT
       COALESCE(uc.case_id, ud.case_id) AS case_id,
       COALESCE(uc.cnt, 0)::text AS comments,
       COALESCE(ud.cnt, 0)::text AS documents
     FROM unseen_comments uc
     FULL OUTER JOIN unseen_documents ud ON uc.case_id = ud.case_id
     WHERE COALESCE(uc.cnt, 0) + COALESCE(ud.cnt, 0) > 0`,
    [ownerId]
  )

  return rows.map((row) => {
    const comments = Number(row.comments)
    const documents = Number(row.documents)
    return {
      caseId: row.case_id,
      comments,
      documents,
      total: comments + documents,
    }
  })
}
