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
import { uploadPortalCaseDocument } from '@/features/cases/services/api-attachments-service'
import type { Attachment } from '@/features/cases/types'

function toCaseDocument(att: Attachment): CaseDocument {
  return {
    id: att.id,
    name: att.name,
    mimeType: att.mimeType,
    size: att.size,
    uploadedAt: att.uploadedAt,
    status: 'available',
  }
}

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
      documentIds: input.documentIds,
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
      attachmentIds: input.attachmentIds,
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

export async function addCaseDocument(
  caseId: string,
  file: File
): Promise<ApiResult<CaseDocument>> {
  const result = await uploadPortalCaseDocument(caseId, file)
  if (!result.ok) return result
  return { ok: true, data: toCaseDocument(result.data) }
}

export async function retryPayment(
  _paymentId: string
): Promise<ApiResult<void>> {
  return {
    ok: false,
    error: 'تلاش مجدد پرداخت هنوز به سرور متصل نشده است.',
  }
}
