import type { PortalData } from '@/features/client-portal/types'
import { htmlToPlainText } from '@/lib/html'
import { query, withTransaction } from '../db'
import { ensureCrmClientForPortalUser } from './clients-repo'
import {
  mapCaseComment,
  mapCaseDocument,
  mapClientCase,
  mapClientPayment,
  mapClientProfile,
  mapClientSession,
  mapLawyer,
  mapTimeline,
} from '../mappers'
import * as notificationService from '../services/notification-service'
import type { CaseRow, User } from '../types'

type AttachmentRow = {
  id: string
  name: string
  mime_type: string
  size_bytes: string
  status: string
  created_at: Date
  comment_id: string | null
  uploaded_by: string | null
  seen_by_lawyer_at: Date | null
}

type CommentRow = {
  id: string
  author_id: string | null
  author_role: string
  author_name: string
  body_html: string
  created_at: Date
  seen_by_lawyer_at: Date | null
}

type TimelineRow = {
  id: string
  type: string
  title: string
  description: string | null
  occurred_at: Date
}

type EventRow = {
  id: string
  title: string
  type: string
  status: string
  case_id: string | null
  owner_id: string
  starts_at: Date | null
  event_date: Date | string
  start_time: string
  duration_minutes: number | null
  location: string
  meeting_url: string | null
  description: string
  can_cancel: boolean
  can_reschedule: boolean
  created_at: Date
  updated_at: Date
}

type PaymentRow = {
  id: string
  title: string | null
  case_id: string | null
  amount: string
  status: string
  method: string
  external_transaction_id: string | null
  paid_at: Date | null
  description: string | null
  created_at: Date
  updated_at: Date
}

async function loadPortalCase(row: CaseRow) {
  const [docs, comments, timeline] = await Promise.all([
    query<AttachmentRow>(
      `SELECT id, name, mime_type, size_bytes, status, created_at, comment_id,
              uploaded_by, seen_by_lawyer_at
       FROM attachments WHERE case_id = $1 ORDER BY created_at DESC`,
      [row.id]
    ),
    query<CommentRow>(
      `SELECT id, author_id, author_role, author_name, body_html, created_at,
              seen_by_lawyer_at
       FROM case_comments WHERE case_id = $1 ORDER BY created_at ASC`,
      [row.id]
    ),
    query<TimelineRow>(
      `SELECT id, type, title, description, occurred_at
       FROM case_timeline WHERE case_id = $1 ORDER BY occurred_at DESC`,
      [row.id]
    ),
  ])

  return mapClientCase({
    row,
    documents: docs.rows
      .filter((d) => !d.comment_id)
      .map(mapCaseDocument),
    comments: comments.rows.map((c) => {
      const commentAttachments = docs.rows
        .filter((d) => d.comment_id === c.id)
        .map(mapCaseDocument)
      return mapCaseComment(c, commentAttachments)
    }),
    timeline: timeline.rows.map(mapTimeline),
  })
}

export async function getPortalData(user: User): Promise<PortalData> {
  const { rows: caseRows } = await query<CaseRow>(
    `SELECT * FROM cases WHERE client_user_id = $1 ORDER BY updated_at DESC`,
    [user.id]
  )

  const cases = await Promise.all(caseRows.map(loadPortalCase))

  const lawyerIds = [...new Set(caseRows.map((c) => c.owner_id))]
  let lawyers: ReturnType<typeof mapLawyer>[] = []
  if (lawyerIds.length > 0) {
    const { rows: lawyerRows } = await query<User>(
      `SELECT * FROM users
       WHERE id = ANY($1::uuid[])
         AND role IN ('lawyer', 'super_admin')
         AND is_active = TRUE`,
      [lawyerIds]
    )
    lawyers = lawyerRows.map(mapLawyer)
  }

  const { rows: sessions } = await query<EventRow>(
    `SELECT * FROM events
     WHERE client_user_id = $1
     ORDER BY COALESCE(starts_at, (event_date + start_time)) DESC`,
    [user.id]
  )

  const { rows: payments } = await query<PaymentRow>(
    `SELECT * FROM case_payments
     WHERE client_user_id = $1
     ORDER BY created_at DESC`,
    [user.id]
  )

  return {
    profile: mapClientProfile(user),
    lawyers,
    cases,
    sessions: sessions.map(mapClientSession),
    payments: payments.map(mapClientPayment),
  }
}

export async function createPortalCase(
  user: User,
  input: {
    title: string
    legalArea: string
    descriptionHtml?: string
    lawyerId?: string
    documentIds?: string[]
  }
) {
  const descriptionHtml = input.descriptionHtml?.trim() ?? ''
  const description = htmlToPlainText(descriptionHtml)
  const title = input.title.trim()
  if (!title) throw new Error('عنوان پرونده الزامی است.')

  let lawyerId = input.lawyerId
  if (!lawyerId) {
    const { rows } = await query<{ id: string }>(
      `SELECT id FROM users
       WHERE role IN ('lawyer', 'super_admin') AND is_active = TRUE
       ORDER BY CASE WHEN role = 'super_admin' THEN 0 ELSE 1 END, created_at ASC
       LIMIT 1`
    )
    lawyerId = rows[0]?.id
  }
  if (!lawyerId) throw new Error('هیچ وکیلی برای ثبت پرونده یافت نشد.')

  const { rows: lawyerCheck } = await query<{ id: string }>(
    `SELECT id FROM users
     WHERE id = $1 AND role IN ('lawyer', 'super_admin') AND is_active = TRUE`,
    [lawyerId]
  )
  if (!lawyerCheck[0]) throw new Error('وکیل انتخاب‌شده معتبر نیست.')

  const clientId = await ensureCrmClientForPortalUser(user, lawyerId)
  if (!clientId) throw new Error('ثبت موکل در CRM ناموفق بود.')

  const year = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
  }).format(new Date())

  const { rows: countRows } = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM cases WHERE owner_id = $1`,
    [lawyerId]
  )
  const seq = String(Number(countRows[0]?.count ?? 0) + 1).padStart(4, '0')
  const caseNumber = `${year}-${seq}`

  return withTransaction(async (client) => {
    const { rows: caseRows } = await client.query<CaseRow>(
      `INSERT INTO cases (
         case_number, title, description, description_html, legal_area,
         status, owner_id, client_id, client_user_id, created_by, lawyer_synced
       ) VALUES ($1,$2,$3,$4,$5,'under_review',$6,$7,$8,'client', FALSE)
       RETURNING *`,
      [
        caseNumber,
        title,
        description,
        descriptionHtml,
        input.legalArea,
        lawyerId,
        clientId,
        user.id,
      ]
    )
    const caseRow = caseRows[0]!

    await client.query(
      `INSERT INTO case_timeline (case_id, type, title, description)
       VALUES ($1, 'created', 'ایجاد پرونده',
               'پرونده توسط موکل ثبت شد و در انتظار بررسی وکیل است.')`,
      [caseRow.id]
    )

    for (const docId of input.documentIds ?? []) {
      await client.query(
        `UPDATE attachments
         SET status = 'available'
         WHERE id = $1 AND case_id = $2 AND uploaded_by = $3 AND storage_key IS NOT NULL`,
        [docId, caseRow.id, user.id]
      )
    }

    return { caseRow, clientId }
  }).then(async ({ caseRow, clientId: crmClientId }) => {
    await notificationService.notifyCaseCreatedByClient({
      lawyerId: lawyerId!,
      actorId: user.id,
      caseId: caseRow.id,
      clientId: crmClientId,
      clientName: user.name || 'موکل',
      title: caseRow.title,
    })
    return loadPortalCase(caseRow)
  })
}

export async function addPortalComment(
  user: User,
  caseId: string,
  input: {
    bodyHtml: string
    attachmentIds?: string[]
  }
) {
  const { rows } = await query<CaseRow>(
    `SELECT * FROM cases WHERE id = $1 AND client_user_id = $2 LIMIT 1`,
    [caseId, user.id]
  )
  const caseRow = rows[0]
  if (!caseRow) throw new Error('پرونده یافت نشد.')

  const bodyHtml = input.bodyHtml?.trim() || '<p></p>'
  const plain = htmlToPlainText(bodyHtml)
  const attachmentIds = input.attachmentIds ?? []
  if (!plain && attachmentIds.length === 0) {
    throw new Error('متن پیام یا پیوست الزامی است.')
  }

  const { rows: comments } = await query<CommentRow>(
    `INSERT INTO case_comments (case_id, author_id, author_role, author_name, body_html)
     VALUES ($1,$2,'client',$3,$4)
     RETURNING id, author_id, author_role, author_name, body_html, created_at,
               seen_by_lawyer_at`,
    [caseId, user.id, user.name || 'موکل', bodyHtml]
  )
  const comment = comments[0]!

  if (attachmentIds.length > 0) {
    await query(
      `UPDATE attachments
       SET comment_id = $1, status = 'available'
       WHERE id = ANY($2::uuid[])
         AND case_id = $3
         AND uploaded_by = $4
         AND storage_key IS NOT NULL`,
      [comment.id, attachmentIds, caseId, user.id]
    )
  }

  await query(
    `INSERT INTO case_timeline (case_id, type, title, description)
     VALUES ($1, 'note', 'پیام جدید', 'موکل پیام جدیدی در گفتگوی پرونده ثبت کرد.')`,
    [caseId]
  )

  const { rows: linkedDocs } = await query<AttachmentRow>(
    `SELECT id, name, mime_type, size_bytes, status, created_at, comment_id,
            uploaded_by, seen_by_lawyer_at
     FROM attachments WHERE comment_id = $1`,
    [comment.id]
  )

  await notificationService.notifyClientComment({
    lawyerId: caseRow.owner_id,
    actorId: user.id,
    caseId,
    clientId: caseRow.client_id,
    clientName: user.name || 'موکل',
    title: caseRow.title,
    attachmentCount: linkedDocs.length,
    messageText: plain,
  })

  return mapCaseComment(comment, linkedDocs.map(mapCaseDocument))
}

export async function deletePortalComment(
  user: User,
  caseId: string,
  commentId: string
): Promise<void> {
  const { rows } = await query<{
    id: string
    author_id: string | null
    author_role: string
    seen_by_lawyer_at: Date | null
  }>(
    `SELECT cc.id, cc.author_id, cc.author_role, cc.seen_by_lawyer_at
     FROM case_comments cc
     JOIN cases c ON c.id = cc.case_id
     WHERE cc.id = $1 AND cc.case_id = $2 AND c.client_user_id = $3
     LIMIT 1`,
    [commentId, caseId, user.id]
  )
  const comment = rows[0]
  if (!comment) throw new Error('پیام یافت نشد.')
  if (comment.author_role !== 'client' || comment.author_id !== user.id) {
    throw new Error('فقط پیام‌های خودتان قابل حذف است.')
  }
  if (comment.seen_by_lawyer_at) {
    throw new Error('پس از مشاهده توسط وکیل، حذف پیام امکان‌پذیر نیست.')
  }

  await query(`DELETE FROM case_comments WHERE id = $1`, [commentId])
}

export async function cancelPortalSession(
  user: User,
  sessionId: string
): Promise<void> {
  const { rows } = await query<{
    id: string
    status: string
    can_cancel: boolean
    owner_id: string
    title: string
    case_id: string | null
    client_id: string | null
  }>(
    `SELECT id, status, can_cancel, owner_id, title, case_id, client_id
     FROM events
     WHERE id = $1 AND client_user_id = $2 LIMIT 1`,
    [sessionId, user.id]
  )
  const session = rows[0]
  if (!session) throw new Error('جلسه یافت نشد.')
  if (!session.can_cancel) throw new Error('لغو این جلسه مجاز نیست.')
  if (session.status === 'cancelled' || session.status === 'completed') {
    throw new Error('وضعیت جلسه قابل تغییر نیست.')
  }

  await query(
    `UPDATE events
     SET status = 'cancelled', can_cancel = FALSE, can_reschedule = FALSE
     WHERE id = $1 AND client_user_id = $2`,
    [sessionId, user.id]
  )

  await notificationService.notifySessionCancelledByClient({
    lawyerId: session.owner_id,
    actorId: user.id,
    eventId: session.id,
    caseId: session.case_id,
    clientId: session.client_id,
    clientName: user.name || 'موکل',
    title: session.title,
  })
}
