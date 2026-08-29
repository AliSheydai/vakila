import type {
  Attachment,
  Case,
  CreateAttachmentInput,
  CreateCaseInput,
  CreateExpenseInput,
  CreatePaymentInput,
  Expense,
  Fee,
  Payment,
  UpdateCaseInput,
  UpsertFeeInput,
} from '@/features/cases/types'
import type { CaseComment } from '@/features/client-portal/types'
import type { CaseStatus } from '@/features/cases/types'
import { htmlToPlainText } from '@/lib/html'
import { query, withTransaction } from '../db'
import {
  mapAttachment,
  mapCase,
  mapCaseComment,
  mapCaseDocument,
  mapExpense,
  mapFee,
  mapPayment,
} from '../mappers'
import * as notificationService from '../services/notification-service'
import type { CaseRow } from '../types'

type FeeRow = {
  id: string
  case_id: string
  amount: string
  description: string | null
  due_date: Date | null
  created_at: Date
  updated_at: Date
}

type PaymentRow = {
  id: string
  case_id: string | null
  owner_id: string
  amount: string
  paid_at: Date | null
  method: string
  source: string
  status: string
  description: string | null
  external_transaction_id: string | null
  created_at: Date
  updated_at: Date
}

type ExpenseRow = {
  id: string
  case_id: string
  title: string
  category: string
  amount: string
  expense_date: Date
  description: string | null
  created_at: Date
  updated_at: Date
}

type AttachmentRow = {
  id: string
  case_id: string | null
  name: string
  mime_type: string
  size_bytes: string
  created_at: Date
  uploaded_by: string | null
  comment_id: string | null
  seen_by_lawyer_at: Date | null
}

type CommentRow = {
  id: string
  case_id: string
  author_id: string | null
  author_role: string
  author_name: string
  body_html: string
  created_at: Date
  seen_by_lawyer_at: Date | null
}

type CaseNotifyRow = {
  id: string
  case_number: string
  title: string
  status: string
  owner_id: string
  client_id: string | null
  client_user_id: string | null
}

async function getCaseNotifyRow(
  ownerId: string,
  caseId: string
): Promise<CaseNotifyRow | null> {
  const { rows } = await query<CaseNotifyRow>(
    `SELECT id, case_number, title, status, owner_id, client_id, client_user_id
     FROM cases WHERE id = $1 AND owner_id = $2 LIMIT 1`,
    [caseId, ownerId]
  )
  return rows[0] ?? null
}

async function loadCaseBundle(
  row: CaseRow
): Promise<Case> {
  const [feeRes, payRes, expRes, attRes] = await Promise.all([
    query<FeeRow>(`SELECT * FROM case_fees WHERE case_id = $1`, [row.id]),
    query<PaymentRow>(
      `SELECT * FROM case_payments WHERE case_id = $1 ORDER BY paid_at DESC NULLS LAST, created_at DESC`,
      [row.id]
    ),
    query<ExpenseRow>(
      `SELECT * FROM case_expenses WHERE case_id = $1 ORDER BY expense_date DESC`,
      [row.id]
    ),
    query<AttachmentRow>(
      `SELECT * FROM attachments
       WHERE case_id = $1 AND comment_id IS NULL
       ORDER BY created_at DESC`,
      [row.id]
    ),
  ])

  return mapCase({
    row,
    fee: feeRes.rows[0] ? mapFee(feeRes.rows[0]) : null,
    payments: payRes.rows.map(mapPayment),
    expenses: expRes.rows.map(mapExpense),
    attachments: attRes.rows.map(mapAttachment),
  })
}

export async function listCases(ownerId: string): Promise<Case[]> {
  const { rows } = await query<CaseRow>(
    `SELECT * FROM cases WHERE owner_id = $1 ORDER BY updated_at DESC`,
    [ownerId]
  )
  return Promise.all(rows.map(loadCaseBundle))
}

export async function getCase(
  ownerId: string,
  id: string
): Promise<Case | null> {
  const { rows } = await query<CaseRow>(
    `SELECT * FROM cases WHERE id = $1 AND owner_id = $2 LIMIT 1`,
    [id, ownerId]
  )
  const row = rows[0]
  if (!row) return null
  return loadCaseBundle(row)
}

async function assertOwnedCase(
  ownerId: string,
  caseId: string
): Promise<CaseRow | null> {
  const { rows } = await query<CaseRow>(
    `SELECT * FROM cases WHERE id = $1 AND owner_id = $2 LIMIT 1`,
    [caseId, ownerId]
  )
  return rows[0] ?? null
}

export async function createCase(
  ownerId: string,
  input: CreateCaseInput
): Promise<Case> {
  const { rows } = await query<CaseRow>(
    `INSERT INTO cases (
       case_number, title, description, legal_area, status,
       owner_id, client_id, created_by, lawyer_synced
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,'lawyer', TRUE)
     RETURNING *`,
    [
      input.caseNumber.trim(),
      input.title.trim(),
      input.description?.trim() ?? '',
      input.legalArea,
      input.status ?? 'new',
      ownerId,
      input.clientId ?? null,
    ]
  )

  const caseRow = rows[0]!
  if (input.clientId) {
    await query(
      `UPDATE cases c
       SET client_user_id = cl.linked_user_id
       FROM clients cl
       WHERE c.id = $1 AND cl.id = c.client_id AND cl.owner_id = $2`,
      [caseRow.id, ownerId]
    )
  }

  await query(
    `INSERT INTO case_timeline (case_id, type, title, description)
     VALUES ($1, 'created', 'ایجاد پرونده', 'پرونده توسط وکیل ثبت شد.')`,
    [caseRow.id]
  )

  const refreshed = await getCase(ownerId, caseRow.id)
  const notifyRow = await getCaseNotifyRow(ownerId, caseRow.id)
  if (notifyRow) {
    await notificationService.notifyCaseCreatedForClient({
      clientUserId: notifyRow.client_user_id,
      actorId: ownerId,
      caseId: notifyRow.id,
      clientId: notifyRow.client_id,
      title: notifyRow.title,
      caseNumber: notifyRow.case_number,
    })
  }
  return refreshed!
}

export async function updateCase(
  ownerId: string,
  id: string,
  input: UpdateCaseInput
): Promise<Case | null> {
  const existing = await assertOwnedCase(ownerId, id)
  if (!existing) return null

  const statusChanged =
    input.status !== undefined && input.status !== existing.status

  const fieldsChanged =
    statusChanged ||
    (input.title !== undefined && input.title.trim() !== existing.title) ||
    (input.caseNumber !== undefined &&
      input.caseNumber.trim() !== existing.case_number) ||
    (input.legalArea !== undefined && input.legalArea !== existing.legal_area) ||
    (input.description !== undefined &&
      (input.description?.trim() ?? '') !== existing.description) ||
    (input.clientId !== undefined && input.clientId !== existing.client_id)

  await query(
    `UPDATE cases SET
       title = COALESCE($3, title),
       case_number = COALESCE($4, case_number),
       legal_area = COALESCE($5, legal_area),
       status = COALESCE($6, status),
       description = CASE WHEN $7::boolean THEN $8 ELSE description END,
       client_id = CASE WHEN $9::boolean THEN $10 ELSE client_id END,
       lawyer_synced = TRUE
     WHERE id = $1 AND owner_id = $2`,
    [
      id,
      ownerId,
      input.title?.trim() ?? null,
      input.caseNumber?.trim() ?? null,
      input.legalArea ?? null,
      input.status ?? null,
      input.description !== undefined,
      input.description?.trim() ?? '',
      input.clientId !== undefined,
      input.clientId ?? null,
    ]
  )

  if (input.clientId !== undefined) {
    await query(
      `UPDATE cases c
       SET client_user_id = cl.linked_user_id
       FROM clients cl
       WHERE c.id = $1 AND cl.id = c.client_id AND cl.owner_id = $2`,
      [id, ownerId]
    )
    if (input.clientId === null) {
      await query(
        `UPDATE cases SET client_user_id = NULL WHERE id = $1 AND owner_id = $2`,
        [id, ownerId]
      )
    }
  }

  const notifyRow = await getCaseNotifyRow(ownerId, id)
  if (notifyRow && fieldsChanged) {
    await notificationService.notifyCaseUpdatedForClient({
      clientUserId: notifyRow.client_user_id,
      actorId: ownerId,
      caseId: notifyRow.id,
      clientId: notifyRow.client_id,
      title: notifyRow.title,
      statusChanged,
      newStatus: input.status as CaseStatus | undefined,
    })
  }

  return getCase(ownerId, id)
}

export async function deleteCase(
  ownerId: string,
  id: string
): Promise<boolean> {
  const { rowCount } = await query(
    `DELETE FROM cases WHERE id = $1 AND owner_id = $2`,
    [id, ownerId]
  )
  return (rowCount ?? 0) > 0
}

export async function upsertFee(
  ownerId: string,
  caseId: string,
  input: UpsertFeeInput
): Promise<Fee | null> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return null

  const { rows: existingFeeRows } = await query<FeeRow>(
    `SELECT * FROM case_fees WHERE case_id = $1 LIMIT 1`,
    [caseId]
  )
  const existingFee = existingFeeRows[0]

  const { rows } = await query<FeeRow>(
    `INSERT INTO case_fees (case_id, amount, description, due_date)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (case_id) DO UPDATE SET
       amount = EXCLUDED.amount,
       description = EXCLUDED.description,
       due_date = EXCLUDED.due_date
     RETURNING *`,
    [
      caseId,
      input.amount,
      input.description?.trim() || null,
      input.dueDate ?? null,
    ]
  )
  const fee = mapFee(rows[0]!)
  const feeChanged =
    !existingFee ||
    Number(existingFee.amount) !== fee.amount ||
    (existingFee.description ?? '') !== (fee.description ?? '') ||
    String(existingFee.due_date ?? '') !== String(input.dueDate ?? '')

  if (feeChanged) {
    const notifyRow = await getCaseNotifyRow(ownerId, caseId)
    if (notifyRow) {
      await notificationService.notifyFeeUpdated({
        clientUserId: notifyRow.client_user_id,
        actorId: ownerId,
        caseId,
        clientId: notifyRow.client_id,
        title: notifyRow.title,
        amount: fee.amount,
      })
    }
  }
  return fee
}

export async function addPayment(
  ownerId: string,
  caseId: string,
  input: CreatePaymentInput
): Promise<Payment | null> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return null

  const { rows } = await query<PaymentRow>(
    `INSERT INTO case_payments (
       case_id, owner_id, client_user_id, amount, paid_at,
       method, source, status, description, external_transaction_id, title
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      caseId,
      ownerId,
      owned.client_user_id,
      input.amount,
      input.date,
      input.method,
      input.source ?? 'manual',
      input.status ?? 'completed',
      input.description?.trim() || null,
      input.externalTransactionId ?? null,
      'پرداخت',
    ]
  )
  const payment = mapPayment(rows[0]!)
  const notifyRow = await getCaseNotifyRow(ownerId, caseId)
  if (notifyRow) {
    await notificationService.notifyPaymentRecorded({
      clientUserId: notifyRow.client_user_id,
      actorId: ownerId,
      caseId,
      clientId: notifyRow.client_id,
      title: notifyRow.title,
      amount: payment.amount,
    })
  }
  return payment
}

export async function deletePayment(
  ownerId: string,
  caseId: string,
  paymentId: string
): Promise<boolean> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return false

  const { rows: paymentRows } = await query<{ amount: string }>(
    `SELECT amount FROM case_payments WHERE id = $1 AND case_id = $2 AND owner_id = $3`,
    [paymentId, caseId, ownerId]
  )
  const paymentRow = paymentRows[0]

  const { rowCount } = await query(
    `DELETE FROM case_payments WHERE id = $1 AND case_id = $2 AND owner_id = $3`,
    [paymentId, caseId, ownerId]
  )

  if ((rowCount ?? 0) > 0 && paymentRow) {
    const notifyRow = await getCaseNotifyRow(ownerId, caseId)
    if (notifyRow) {
      await notificationService.notifyPaymentDeleted({
        clientUserId: notifyRow.client_user_id,
        actorId: ownerId,
        caseId,
        clientId: notifyRow.client_id,
        title: notifyRow.title,
        amount: Number(paymentRow.amount),
      })
    }
  }

  return (rowCount ?? 0) > 0
}

export async function addExpense(
  ownerId: string,
  caseId: string,
  input: CreateExpenseInput
): Promise<Expense | null> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return null

  const { rows } = await query<ExpenseRow>(
    `INSERT INTO case_expenses (case_id, title, category, amount, expense_date, description)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      caseId,
      input.title.trim(),
      input.category,
      input.amount,
      input.date,
      input.description?.trim() || null,
    ]
  )
  return mapExpense(rows[0]!)
}

export async function deleteExpense(
  ownerId: string,
  caseId: string,
  expenseId: string
): Promise<boolean> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return false
  const { rowCount } = await query(
    `DELETE FROM case_expenses e
     USING cases c
     WHERE e.id = $1 AND e.case_id = $2 AND e.case_id = c.id AND c.owner_id = $3`,
    [expenseId, caseId, ownerId]
  )
  return (rowCount ?? 0) > 0
}

export async function addAttachment(
  ownerId: string,
  caseId: string,
  input: { name: string; mimeType: string; size: number; uploadedBy?: string },
  uploadedBy?: string
): Promise<Attachment | null> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return null

  const { rows } = await query<AttachmentRow>(
    `INSERT INTO attachments (case_id, name, mime_type, size_bytes, uploaded_by)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [
      caseId,
      input.name.trim(),
      input.mimeType,
      input.size,
      uploadedBy ?? input.uploadedBy ?? null,
    ]
  )
  return mapAttachment(rows[0]!)
}

export async function deleteAttachment(
  ownerId: string,
  caseId: string,
  attachmentId: string
): Promise<boolean> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return false
  const { rowCount } = await query(
    `DELETE FROM attachments a
     USING cases c
     WHERE a.id = $1 AND a.case_id = $2 AND a.case_id = c.id AND c.owner_id = $3`,
    [attachmentId, caseId, ownerId]
  )
  return (rowCount ?? 0) > 0
}

export async function listComments(
  ownerId: string,
  caseId: string,
  options?: { markSeen?: boolean }
): Promise<CaseComment[] | null> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return null

  if (options?.markSeen) {
    await markClientCommentsSeen(ownerId, caseId)
  }

  const [commentsRes, docsRes] = await Promise.all([
    query<CommentRow>(
      `SELECT * FROM case_comments WHERE case_id = $1 ORDER BY created_at ASC`,
      [caseId]
    ),
    query<{
      id: string
      name: string
      mime_type: string
      size_bytes: string
      status: string
      created_at: Date
      comment_id: string | null
      uploaded_by: string | null
      seen_by_lawyer_at: Date | null
    }>(
      `SELECT id, name, mime_type, size_bytes, status, created_at, comment_id,
              uploaded_by, seen_by_lawyer_at
       FROM attachments WHERE case_id = $1 AND comment_id IS NOT NULL`,
      [caseId]
    ),
  ])

  return commentsRes.rows.map((row) => {
    const commentAttachments = docsRes.rows
      .filter((d) => d.comment_id === row.id)
      .map(mapCaseDocument)
    return mapCaseComment(row, commentAttachments)
  })
}

export async function countUnseenClientComments(
  ownerId: string,
  caseId: string
): Promise<number | null> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return null
  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM case_comments
     WHERE case_id = $1 AND author_role = 'client' AND seen_by_lawyer_at IS NULL`,
    [caseId]
  )
  return Number(rows[0]?.count ?? 0)
}

export async function markClientCommentsSeen(
  ownerId: string,
  caseId: string
): Promise<number> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return 0

  const { rows: seenIds } = await query<{ id: string }>(
    `UPDATE case_comments
     SET seen_by_lawyer_at = NOW()
     WHERE case_id = $1 AND author_role = 'client' AND seen_by_lawyer_at IS NULL
     RETURNING id`,
    [caseId]
  )

  if (seenIds.length > 0) {
    await query(
      `UPDATE attachments
       SET seen_by_lawyer_at = NOW()
       WHERE comment_id = ANY($1::uuid[]) AND seen_by_lawyer_at IS NULL`,
      [seenIds.map((r) => r.id)]
    )
  }

  return seenIds.length
}

export async function markClientDocumentsSeen(
  ownerId: string,
  caseId: string
): Promise<number> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return 0
  const { rowCount } = await query(
    `UPDATE attachments a
     SET seen_by_lawyer_at = NOW()
     FROM cases c
     WHERE a.case_id = c.id
       AND c.id = $1
       AND c.owner_id = $2
       AND a.comment_id IS NULL
       AND a.uploaded_by = c.client_user_id
       AND a.seen_by_lawyer_at IS NULL`,
    [caseId, ownerId]
  )
  return rowCount ?? 0
}

export async function addComment(
  ownerId: string,
  caseId: string,
  input: { bodyHtml: string; authorName: string; authorId: string }
): Promise<CaseComment | null> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return null

  const { rows } = await query<CommentRow>(
    `INSERT INTO case_comments (case_id, author_id, author_role, author_name, body_html)
     VALUES ($1,$2,'lawyer',$3,$4)
     RETURNING *`,
    [caseId, input.authorId, input.authorName, input.bodyHtml]
  )

  await query(
    `INSERT INTO case_timeline (case_id, type, title, description)
     VALUES ($1, 'note', 'پاسخ وکیل', 'وکیل در گفتگوی پرونده پاسخ داد.')`,
    [caseId]
  )

  const notifyRow = await getCaseNotifyRow(ownerId, caseId)
  if (notifyRow) {
    await notificationService.notifyLawyerComment({
      clientUserId: notifyRow.client_user_id,
      actorId: input.authorId,
      caseId,
      clientId: notifyRow.client_id,
      title: notifyRow.title,
      messageText: htmlToPlainText(input.bodyHtml),
    })
  }

  return mapCaseComment(rows[0]!)
}

export { withTransaction }
