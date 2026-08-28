/** تبدیل متن ساده به پاراگراف HTML برای نمایش/ذخیره. */
export function plainTextToHtml(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  const escaped = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return `<p>${escaped.replace(/\n+/g, '</p><p>')}</p>`
}

/** استخراج تقریبی متن ساده از HTML ادیتور. */
export function htmlToPlainText(html: string): string {
  if (!html.trim()) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function isEmptyHtml(html: string): boolean {
  return htmlToPlainText(html).length === 0
}
