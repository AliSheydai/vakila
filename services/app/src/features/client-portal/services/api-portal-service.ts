import { api, type ApiResult } from '@/lib/api-client'
import type {
  CaseComment,
  CaseDocument,
  ClientCase,
  PortalData,
} from '../types'
import type {
  AddCaseCommentInput,
  CreateCaseInput,
} from './portal-service'

export async function fetchPortal(): Promise<ApiResult<PortalData>> {
  return api<PortalData>('/api/portal')
}

export async function createPortalCase(
  input: CreateCaseInput
): Promise<ApiResult<ClientCase>> {
  return api<ClientCase>('/api/portal/cases', {
    method: 'POST',
    body: {
      title: input.title,
      legalArea: input.legalArea,
      descriptionHtml: input.descriptionHtml,
      lawyerId: input.lawyerId,
      documents: input.documents?.map((d) => ({
        name: d.name,
        mimeType: d.mimeType,
        size: d.size,
      })),
    },
  })
}

export async function addPortalComment(
  caseId: string,
  input: AddCaseCommentInput
): Promise<ApiResult<CaseComment>> {
  return api<CaseComment>(`/api/portal/cases/${caseId}/comments`, {
    method: 'POST',
    body: {
      bodyHtml: input.bodyHtml,
      attachments: input.attachments?.map((d) => ({
        name: d.name,
        mimeType: d.mimeType,
        size: d.size,
      })),
    },
  })
}

export async function cancelPortalSession(
  sessionId: string
): Promise<ApiResult<void>> {
  const result = await api<{ cancelled: boolean }>(
    `/api/portal/sessions/${sessionId}/cancel`,
    { method: 'POST' }
  )
  if (!result.ok) return result
  return { ok: true, data: undefined }
}

/** Not yet exposed by API — kept for UI compatibility. */
export async function addCaseDocument(
  _caseId: string,
  _input: Omit<CaseDocument, 'id' | 'uploadedAt' | 'status'>
): Promise<ApiResult<CaseDocument>> {
  return {
    ok: false,
    error: 'آپلود مدرک از پنل موکل هنوز به سرور متصل نشده است.',
  }
}

export async function retryPayment(
  _paymentId: string
): Promise<ApiResult<void>> {
  return {
    ok: false,
    error: 'تلاش مجدد پرداخت هنوز به سرور متصل نشده است.',
  }
}
