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
import type { CaseRow, User } from '../types'

type AttachmentRow = {
  id: string
  name: string
  mime_type: string
  size_bytes: string
  status: string
  created_at: Date
}

type CommentRow = {
  id: string
  author_role: string
  author_name: string
  body_html: string
  created_at: Date
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
      `SELECT id, name, mime_type, size_bytes, status, created_at
       FROM attachments WHERE case_id = $1 ORDER BY created_at DESC`,
      [row.id]
    ),
    query<CommentRow>(
      `SELECT id, author_role, author_name, body_html, created_at
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
    documents: docs.rows.map(mapCaseDocument),
    comments: comments.rows.map(mapCaseComment),
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
    documents?: { name: string; mimeType: string; size: number }[]
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

    for (const doc of input.documents ?? []) {
      await client.query(
        `INSERT INTO attachments (case_id, name, mime_type, size_bytes, uploaded_by, status)
         VALUES ($1,$2,$3,$4,$5,'available')`,
        [caseRow.id, doc.name, doc.mimeType, doc.size, user.id]
      )
    }

    return loadPortalCase(caseRow)
  })
}

export async function addPortalComment(
  user: User,
  caseId: string,
  input: {
    bodyHtml: string
    attachments?: { name: string; mimeType: string; size: number }[]
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
  const attachmentsMeta = input.attachments ?? []
  if (!plain && attachmentsMeta.length === 0) {
    throw new Error('متن پیام یا پیوست الزامی است.')
  }

  const { rows: comments } = await query<CommentRow>(
    `INSERT INTO case_comments (case_id, author_id, author_role, author_name, body_html)
     VALUES ($1,$2,'client',$3,$4)
     RETURNING id, author_role, author_name, body_html, created_at`,
    [caseId, user.id, user.name || 'موکل', bodyHtml]
  )

  for (const doc of attachmentsMeta) {
    await query(
      `INSERT INTO attachments (case_id, name, mime_type, size_bytes, uploaded_by, status)
       VALUES ($1,$2,$3,$4,$5,'available')`,
      [caseId, doc.name, doc.mimeType, doc.size, user.id]
    )
  }

  await query(
    `INSERT INTO case_timeline (case_id, type, title, description)
     VALUES ($1, 'note', 'پیام جدید', 'موکل پیام جدیدی در گفتگوی پرونده ثبت کرد.')`,
    [caseId]
  )

  return mapCaseComment(comments[0]!)
}

export async function cancelPortalSession(
  user: User,
  sessionId: string
): Promise<void> {
  const { rows } = await query<{
    id: string
    status: string
    can_cancel: boolean
  }>(
    `SELECT id, status, can_cancel FROM events
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
}
