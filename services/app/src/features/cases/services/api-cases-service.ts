import type { CaseComment } from '@/features/client-portal/types'
import { api, type ApiResult } from '@/lib/api-client'
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
} from '../types'

export async function listCases(): Promise<ApiResult<Case[]>> {
  return api<Case[]>('/api/cases')
}

export async function getCase(caseId: string): Promise<ApiResult<Case>> {
  return api<Case>(`/api/cases/${caseId}`)
}

export async function createCase(
  input: CreateCaseInput
): Promise<ApiResult<Case>> {
  return api<Case>('/api/cases', { method: 'POST', body: input })
}

export async function updateCase(
  caseId: string,
  input: UpdateCaseInput
): Promise<ApiResult<Case>> {
  return api<Case>(`/api/cases/${caseId}`, {
    method: 'PATCH',
    body: input,
  })
}

export async function deleteCase(caseId: string): Promise<ApiResult<void>> {
  const result = await api<{ deleted: boolean }>(`/api/cases/${caseId}`, {
    method: 'DELETE',
  })
  if (!result.ok) return result
  return { ok: true, data: undefined }
}

export async function upsertFee(
  caseId: string,
  input: UpsertFeeInput
): Promise<ApiResult<Fee>> {
  return api<Fee>(`/api/cases/${caseId}/fee`, {
    method: 'POST',
    body: input,
  })
}

export async function addPayment(
  caseId: string,
  input: CreatePaymentInput
): Promise<ApiResult<Payment>> {
  return api<Payment>(`/api/cases/${caseId}/payments`, {
    method: 'POST',
    body: input,
  })
}

export async function deletePayment(
  caseId: string,
  paymentId: string
): Promise<ApiResult<void>> {
  const result = await api<{ deleted: boolean }>(
    `/api/cases/${caseId}/payments/${paymentId}`,
    { method: 'DELETE' }
  )
  if (!result.ok) return result
  return { ok: true, data: undefined }
}

export async function addExpense(
  caseId: string,
  input: CreateExpenseInput
): Promise<ApiResult<Expense>> {
  return api<Expense>(`/api/cases/${caseId}/expenses`, {
    method: 'POST',
    body: input,
  })
}

export async function deleteExpense(
  caseId: string,
  expenseId: string
): Promise<ApiResult<void>> {
  const result = await api<{ deleted: boolean }>(
    `/api/cases/${caseId}/expenses/${expenseId}`,
    { method: 'DELETE' }
  )
  if (!result.ok) return result
  return { ok: true, data: undefined }
}

export async function addAttachment(
  caseId: string,
  input: CreateAttachmentInput
): Promise<ApiResult<Attachment>> {
  return api<Attachment>(`/api/cases/${caseId}/attachments`, {
    method: 'POST',
    body: input,
  })
}

export async function deleteAttachment(
  caseId: string,
  attachmentId: string
): Promise<ApiResult<void>> {
  const result = await api<{ deleted: boolean }>(
    `/api/cases/${caseId}/attachments/${attachmentId}`,
    { method: 'DELETE' }
  )
  if (!result.ok) return result
  return { ok: true, data: undefined }
}

export async function listCaseComments(
  caseId: string
): Promise<ApiResult<CaseComment[]>> {
  return api<CaseComment[]>(`/api/cases/${caseId}/comments`)
}

export async function addCaseComment(
  caseId: string,
  bodyHtml: string
): Promise<ApiResult<CaseComment>> {
  return api<CaseComment>(`/api/cases/${caseId}/comments`, {
    method: 'POST',
    body: { bodyHtml },
  })
}

export async function markClientDocumentsSeen(
  caseId: string
): Promise<ApiResult<{ marked: number }>> {
  return api<{ marked: number }>(`/api/cases/${caseId}/attachments/seen`, {
    method: 'POST',
  })
}
