import {
  casesCollectionSchema,
  type Attachment,
  type Case,
  type CaseStatus,
  type CreateAttachmentInput,
  type CreateCaseInput,
  type CreateExpenseInput,
  type CreatePaymentInput,
  type Expense,
  type Fee,
  type Payment,
  type UpdateCaseInput,
  type UpsertFeeInput,
} from '../types'
import { createId, nowIso } from '../utils/id'
import { readJson, writeJson } from './storage'

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function persist(ownerId: string, cases: Case[]): ServiceResult<Case[]> {
  const result = writeJson(ownerId, 'cases', cases)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: cases }
}

function touch(caseItem: Case): Case {
  return { ...caseItem, updatedAt: nowIso() }
}

export function listCases(ownerId: string): ServiceResult<Case[]> {
  const raw = readJson<unknown>(ownerId, 'cases', [])

  if (!raw.ok) {
    return { ok: false, error: raw.error }
  }

  if (raw.empty) {
    return { ok: true, data: [] }
  }

  const parsed = casesCollectionSchema.safeParse(raw.data)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'ساختار داده‌های پرونده‌ها نامعتبر است.',
    }
  }

  return { ok: true, data: parsed.data }
}

export function getCase(
  ownerId: string,
  caseId: string
): ServiceResult<Case | null> {
  const list = listCases(ownerId)
  if (!list.ok) return list
  return {
    ok: true,
    data: list.data.find((item) => item.id === caseId) ?? null,
  }
}

export function createCase(
  ownerId: string,
  input: CreateCaseInput
): ServiceResult<Case> {
  const list = listCases(ownerId)
  if (!list.ok) return list

  const caseNumber = input.caseNumber.trim()
  if (list.data.some((item) => item.caseNumber === caseNumber)) {
    return { ok: false, error: 'شماره پرونده تکراری است.' }
  }

  const timestamp = nowIso()
  const caseItem: Case = {
    id: createId('case'),
    caseNumber,
    title: input.title.trim(),
    description: input.description?.trim() ?? '',
    legalArea: input.legalArea,
    status: input.status ?? 'new',
    clientId: input.clientId ?? null,
    ownerId,
    fee: null,
    payments: [],
    expenses: [],
    attachments: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const saved = persist(ownerId, [...list.data, caseItem])
  if (!saved.ok) return saved

  return { ok: true, data: caseItem }
}

export function updateCase(
  ownerId: string,
  caseId: string,
  input: UpdateCaseInput
): ServiceResult<Case> {
  const list = listCases(ownerId)
  if (!list.ok) return list

  const index = list.data.findIndex((item) => item.id === caseId)
  if (index === -1) {
    return { ok: false, error: 'پرونده یافت نشد.' }
  }

  const current = list.data[index]

  if (input.caseNumber !== undefined) {
    const nextNumber = input.caseNumber.trim()
    const duplicate = list.data.some(
      (item) => item.id !== caseId && item.caseNumber === nextNumber
    )
    if (duplicate) {
      return { ok: false, error: 'شماره پرونده تکراری است.' }
    }
  }

  const updated: Case = touch({
    ...current,
    title: input.title !== undefined ? input.title.trim() : current.title,
    caseNumber:
      input.caseNumber !== undefined
        ? input.caseNumber.trim()
        : current.caseNumber,
    legalArea: input.legalArea ?? current.legalArea,
    status: (input.status as CaseStatus | undefined) ?? current.status,
    description:
      input.description !== undefined
        ? input.description.trim()
        : current.description,
    clientId:
      input.clientId !== undefined ? input.clientId : current.clientId,
  })

  const next = [...list.data]
  next[index] = updated

  const saved = persist(ownerId, next)
  if (!saved.ok) return saved

  return { ok: true, data: updated }
}

export function deleteCase(
  ownerId: string,
  caseId: string
): ServiceResult<{ id: string }> {
  const list = listCases(ownerId)
  if (!list.ok) return list

  if (!list.data.some((item) => item.id === caseId)) {
    return { ok: false, error: 'پرونده یافت نشد.' }
  }

  const saved = persist(
    ownerId,
    list.data.filter((item) => item.id !== caseId)
  )
  if (!saved.ok) return saved

  return { ok: true, data: { id: caseId } }
}

function updateCaseById(
  ownerId: string,
  caseId: string,
  updater: (current: Case) => Case | ServiceResult<never>
): ServiceResult<Case> {
  const list = listCases(ownerId)
  if (!list.ok) return list

  const index = list.data.findIndex((item) => item.id === caseId)
  if (index === -1) {
    return { ok: false, error: 'پرونده یافت نشد.' }
  }

  const result = updater(list.data[index])
  if (typeof result === 'object' && result !== null && 'ok' in result) {
    return result
  }

  const updated = touch(result)
  const next = [...list.data]
  next[index] = updated

  const saved = persist(ownerId, next)
  if (!saved.ok) return saved

  return { ok: true, data: updated }
}

export function upsertFee(
  ownerId: string,
  caseId: string,
  input: UpsertFeeInput
): ServiceResult<Case> {
  return updateCaseById(ownerId, caseId, (current) => {
    const timestamp = nowIso()
    const fee: Fee = {
      id: current.fee?.id ?? createId('fee'),
      amount: input.amount,
      description: input.description?.trim() || undefined,
      dueDate: input.dueDate ?? null,
      createdAt: current.fee?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }
    return { ...current, fee }
  })
}

export function addPayment(
  ownerId: string,
  caseId: string,
  input: CreatePaymentInput
): ServiceResult<Case> {
  return updateCaseById(ownerId, caseId, (current) => {
    const timestamp = nowIso()
    const payment: Payment = {
      id: createId('pay'),
      amount: input.amount,
      date: input.date,
      method: input.method,
      source: input.source ?? 'manual',
      status: input.status ?? 'completed',
      description: input.description?.trim() || undefined,
      externalTransactionId: input.externalTransactionId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    return { ...current, payments: [...current.payments, payment] }
  })
}

export function deletePayment(
  ownerId: string,
  caseId: string,
  paymentId: string
): ServiceResult<Case> {
  return updateCaseById(ownerId, caseId, (current) => {
    if (!current.payments.some((payment) => payment.id === paymentId)) {
      return { ok: false, error: 'پرداخت یافت نشد.' }
    }
    return {
      ...current,
      payments: current.payments.filter((payment) => payment.id !== paymentId),
    }
  })
}

export function addExpense(
  ownerId: string,
  caseId: string,
  input: CreateExpenseInput
): ServiceResult<Case> {
  return updateCaseById(ownerId, caseId, (current) => {
    const timestamp = nowIso()
    const expense: Expense = {
      id: createId('exp'),
      title: input.title.trim(),
      category: input.category,
      amount: input.amount,
      date: input.date,
      description: input.description?.trim() || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    return { ...current, expenses: [...current.expenses, expense] }
  })
}

export function deleteExpense(
  ownerId: string,
  caseId: string,
  expenseId: string
): ServiceResult<Case> {
  return updateCaseById(ownerId, caseId, (current) => {
    if (!current.expenses.some((expense) => expense.id === expenseId)) {
      return { ok: false, error: 'هزینه یافت نشد.' }
    }
    return {
      ...current,
      expenses: current.expenses.filter((expense) => expense.id !== expenseId),
    }
  })
}

export function addAttachment(
  ownerId: string,
  caseId: string,
  input: CreateAttachmentInput
): ServiceResult<Case> {
  return updateCaseById(ownerId, caseId, (current) => {
    const attachment: Attachment = {
      id: createId('att'),
      name: input.file.name.trim(),
      mimeType: input.file.type || 'application/octet-stream',
      size: input.file.size,
      uploadedAt: nowIso(),
      uploadedBy: input.uploadedBy,
    }
    return {
      ...current,
      attachments: [...current.attachments, attachment],
    }
  })
}

export function deleteAttachment(
  ownerId: string,
  caseId: string,
  attachmentId: string
): ServiceResult<Case> {
  return updateCaseById(ownerId, caseId, (current) => {
    if (!current.attachments.some((item) => item.id === attachmentId)) {
      return { ok: false, error: 'پیوست یافت نشد.' }
    }
    return {
      ...current,
      attachments: current.attachments.filter(
        (item) => item.id !== attachmentId
      ),
    }
  })
}

export function replaceCases(
  ownerId: string,
  cases: Case[]
): ServiceResult<Case[]> {
  return persist(ownerId, cases)
}
