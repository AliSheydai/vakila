/**
 * Object URLهای جلسه فعلی برای دانلود/پیش‌نمایش مدارک پنل موکل.
 * محتوای فایل در localStorage ذخیره نمی‌شود.
 */

const sessionUrls = new Map<string, string>()

export function setDocumentSessionUrl(documentId: string, file: File): string {
  const previous = sessionUrls.get(documentId)
  if (previous) URL.revokeObjectURL(previous)

  const url = URL.createObjectURL(file)
  sessionUrls.set(documentId, url)
  return url
}

export function getDocumentSessionUrl(
  documentId: string
): string | undefined {
  return sessionUrls.get(documentId)
}

export function revokeDocumentSessionUrl(documentId: string): void {
  const url = sessionUrls.get(documentId)
  if (url) {
    URL.revokeObjectURL(url)
    sessionUrls.delete(documentId)
  }
}

export function hasDocumentSessionUrl(documentId: string): boolean {
  return sessionUrls.has(documentId)
}
