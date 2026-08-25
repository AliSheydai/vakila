/**
 * Object URLهای جلسه فعلی برای دانلود/پیش‌نمایش.
 * محتوای فایل در localStorage ذخیره نمی‌شود.
 */

const sessionUrls = new Map<string, string>()

export function setAttachmentSessionUrl(attachmentId: string, file: File): string {
  const previous = sessionUrls.get(attachmentId)
  if (previous) URL.revokeObjectURL(previous)

  const url = URL.createObjectURL(file)
  sessionUrls.set(attachmentId, url)
  return url
}

export function getAttachmentSessionUrl(attachmentId: string): string | undefined {
  return sessionUrls.get(attachmentId)
}

export function revokeAttachmentSessionUrl(attachmentId: string): void {
  const url = sessionUrls.get(attachmentId)
  if (url) {
    URL.revokeObjectURL(url)
    sessionUrls.delete(attachmentId)
  }
}

export function hasAttachmentSessionUrl(attachmentId: string): boolean {
  return sessionUrls.has(attachmentId)
}
