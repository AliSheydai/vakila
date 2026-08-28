/** Client-safe attachment validation (mirrors server rules). */
export const DEFAULT_MAX_FILE_BYTES = 10 * 1024 * 1024

export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.txt',
] as const

const ALLOWED_MIME_PREFIXES = [
  'application/pdf',
  'application/msword',
  'application/vnd.',
  'image/',
  'text/plain',
] as const

export function validateAttachmentMeta(input: {
  name: string
  mimeType: string
  size: number
  maxBytes: number
}): string | null {
  if (!input.name.trim()) return 'نام فایل الزامی است.'
  if (input.size <= 0) return 'حجم فایل نامعتبر است.'
  if (input.size > input.maxBytes) {
    const mb = Math.round(input.maxBytes / (1024 * 1024))
    return `حجم فایل بیشتر از ${mb} مگابایت است.`
  }
  const lower = input.name.toLowerCase()
  const extOk = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))
  if (!extOk) {
    const mimeOk = ALLOWED_MIME_PREFIXES.some((p) =>
      input.mimeType.startsWith(p)
    )
    if (!mimeOk) return 'نوع فایل پشتیبانی نمی‌شود.'
  }
  return null
}
