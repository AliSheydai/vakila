/** Escape HTML special chars for Telegram HTML parse mode. */
export function esc(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const moneyFormatter = new Intl.NumberFormat('fa-IR')

export function formatDate(isoOrDate: string): string {
  try {
    return dateFormatter.format(new Date(isoOrDate.includes('T') ? isoOrDate : `${isoOrDate}T12:00:00`))
  } catch {
    return isoOrDate
  }
}

export function formatMoney(amount: number): string {
  return `${moneyFormatter.format(amount)} ریال`
}

export function truncate(text: string, max = 200): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

const notificationDateTimeFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatNotificationDateTime(iso: string): string {
  try {
    return notificationDateTimeFormatter.format(new Date(iso))
  } catch {
    return iso
  }
}

/** Readable HTML body for chatbot notification push / detail views. */
export function formatChatbotNotificationHtml(params: {
  title: string
  body: string
  createdAt?: string | null
  heading?: string
}): string {
  const lines = [
    `<b>${esc(params.heading ?? 'اعلان جدید')}</b>`,
    '',
    `<b>${esc(params.title)}</b>`,
  ]
  if (params.createdAt) {
    lines.push(`<i>${esc(formatNotificationDateTime(params.createdAt))}</i>`)
  }
  const body = params.body.trim()
  if (body) {
    lines.push('', esc(body))
  }
  return lines.join('\n')
}

export function pageSlice<T>(items: T[], page: number, pageSize = 5): {
  items: T[]
  page: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
} {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  }
}
