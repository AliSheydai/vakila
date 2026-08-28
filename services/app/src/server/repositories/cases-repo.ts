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
import { query, withTransaction } from '../db'
import {
  mapAttachment,
  mapCase,
  mapCaseComment,
  mapExpense,
  mapFee,
  mapPayment,
} from '../mappers'
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
}

type CommentRow = {
  id: string
  case_id: string
  author_role: string
  author_name: string
  body_html: string
  created_at: Date
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
      `SELECT * FROM attachments WHERE case_id = $1 ORDER BY created_at DESC`,
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
  return refreshed!
}

export async function updateCase(
  ownerId: string,
  id: string,
  input: UpdateCaseInput
): Promise<Case | null> {
  const existing = await assertOwnedCase(ownerId, id)
  if (!existing) return null

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
  return mapFee(rows[0]!)
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
  return mapPayment(rows[0]!)
}

export async function deletePayment(
  ownerId: string,
  caseId: string,
  paymentId: string
): Promise<boolean> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return false
  const { rowCount } = await query(
    `DELETE FROM case_payments WHERE id = $1 AND case_id = $2 AND owner_id = $3`,
    [paymentId, caseId, ownerId]
  )
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
  caseId: string
): Promise<CaseComment[] | null> {
  const owned = await assertOwnedCase(ownerId, caseId)
  if (!owned) return null
  const { rows } = await query<CommentRow>(
    `SELECT * FROM case_comments WHERE case_id = $1 ORDER BY created_at ASC`,
    [caseId]
  )
  return rows.map((row) => mapCaseComment(row))
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
  return mapCaseComment(rows[0]!)
}

export { withTransaction }
