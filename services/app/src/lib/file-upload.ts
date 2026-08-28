import { api, type ApiResult } from '@/lib/api-client'
import type { Attachment } from '@/features/cases/types'

export type UploadInitResult = {
  attachment: Attachment
  uploadUrl: string
}

/** PUT to presigned URL. Returns false when the browser could not confirm success (e.g. CORS). */
async function putToPresignedUrl(
  uploadUrl: string,
  file: File,
  mimeType: string
): Promise<boolean> {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      mode: 'cors',
      headers: { 'Content-Type': mimeType },
      body: file,
    })
    return response.ok || response.status === 200 || response.status === 204
  } catch {
    // Classic CORS symptom: object may still be stored even when fetch fails.
    return false
  }
}

async function completeUpload(
  path: string,
  attempts = 4
): Promise<ApiResult<Attachment>> {
  let last: ApiResult<Attachment> = {
    ok: false,
    error: 'تأیید آپلود فایل ناموفق بود.',
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = await api<Attachment>(path, { method: 'POST' })
    if (result.ok) return result
    last = result
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }

  return last
}

export type AttachmentUploadContext =
  | { type: 'case'; caseId: string }
  | { type: 'client'; clientId: string }
  | { type: 'portal-case'; caseId: string }

function initPath(ctx: AttachmentUploadContext): string {
  switch (ctx.type) {
    case 'case':
      return `/api/cases/${ctx.caseId}/attachments/init`
    case 'client':
      return `/api/clients/${ctx.clientId}/attachments/init`
    case 'portal-case':
      return `/api/portal/cases/${ctx.caseId}/documents/init`
  }
}

function completePath(
  ctx: AttachmentUploadContext,
  attachmentId: string
): string {
  switch (ctx.type) {
    case 'case':
      return `/api/cases/${ctx.caseId}/attachments/${attachmentId}`
    case 'client':
      return `/api/clients/${ctx.clientId}/attachments/${attachmentId}`
    case 'portal-case':
      return `/api/portal/cases/${ctx.caseId}/documents/${attachmentId}`
  }
}

function downloadPath(
  ctx: AttachmentUploadContext,
  attachmentId: string
): string {
  return completePath(ctx, attachmentId)
}

export async function uploadAttachmentFile(
  ctx: AttachmentUploadContext,
  file: File
): Promise<ApiResult<Attachment>> {
  const mimeType = file.type || 'application/octet-stream'
  const init = await api<UploadInitResult>(initPath(ctx), {
    method: 'POST',
    body: { name: file.name, mimeType, size: file.size },
  })
  if (!init.ok) return init

  const putConfirmed = await putToPresignedUrl(
    init.data.uploadUrl,
    file,
    mimeType
  )

  const complete = await completeUpload(
    completePath(ctx, init.data.attachment.id)
  )
  if (complete.ok) return complete

  if (!putConfirmed) {
    return complete
  }

  return {
    ok: false,
    error: complete.error || 'تأیید آپلود فایل ناموفق بود.',
  }
}

export async function getAttachmentDownloadUrl(
  ctx: AttachmentUploadContext,
  attachmentId: string
): Promise<ApiResult<{ url: string; name: string }>> {
  return api<{ url: string; name: string }>(
    downloadPath(ctx, attachmentId),
    { method: 'GET' }
  )
}

export async function deleteUploadedAttachment(
  ctx: AttachmentUploadContext,
  attachmentId: string
): Promise<ApiResult<void>> {
  const result = await api<{ deleted: boolean }>(
    downloadPath(ctx, attachmentId),
    { method: 'DELETE' }
  )
  if (!result.ok) return result
  return { ok: true, data: undefined }
}
