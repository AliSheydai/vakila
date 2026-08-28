import { api, type ApiResult } from '@/lib/api-client'
import type { Attachment } from '@/features/cases/types'
import {
  deleteUploadedAttachment,
  getAttachmentDownloadUrl,
  uploadAttachmentFile,
} from '@/lib/file-upload'

export async function uploadCaseAttachment(
  caseId: string,
  file: File
): Promise<ApiResult<Attachment>> {
  return uploadAttachmentFile({ type: 'case', caseId }, file)
}

export async function downloadCaseAttachment(
  caseId: string,
  attachmentId: string
): Promise<ApiResult<{ url: string; name: string }>> {
  return getAttachmentDownloadUrl({ type: 'case', caseId }, attachmentId)
}

export async function deleteCaseAttachment(
  caseId: string,
  attachmentId: string
): Promise<ApiResult<void>> {
  return deleteUploadedAttachment({ type: 'case', caseId }, attachmentId)
}

export async function uploadClientAttachment(
  clientId: string,
  file: File
): Promise<ApiResult<Attachment>> {
  return uploadAttachmentFile({ type: 'client', clientId }, file)
}

export async function downloadClientAttachment(
  clientId: string,
  attachmentId: string
): Promise<ApiResult<{ url: string; name: string }>> {
  return getAttachmentDownloadUrl({ type: 'client', clientId }, attachmentId)
}

export async function deleteClientAttachmentApi(
  clientId: string,
  attachmentId: string
): Promise<ApiResult<void>> {
  return deleteUploadedAttachment({ type: 'client', clientId }, attachmentId)
}

export async function uploadPortalCaseDocument(
  caseId: string,
  file: File
): Promise<ApiResult<Attachment>> {
  return uploadAttachmentFile({ type: 'portal-case', caseId }, file)
}

export async function downloadPortalCaseDocument(
  caseId: string,
  attachmentId: string
): Promise<ApiResult<{ url: string; name: string }>> {
  return getAttachmentDownloadUrl({ type: 'portal-case', caseId }, attachmentId)
}

export async function deletePortalCaseDocument(
  caseId: string,
  attachmentId: string
): Promise<ApiResult<void>> {
  return deleteUploadedAttachment({ type: 'portal-case', caseId }, attachmentId)
}
