const currencyFormatter = new Intl.NumberFormat('fa-IR')

const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
  hour: '2-digit',
  minute: '2-digit',
})

const fileSizeFormatter = new Intl.NumberFormat('fa-IR', {
  maximumFractionDigits: 1,
})

export function formatMoney(amount: number): string {
  return `${currencyFormatter.format(amount)} ریال`
}

export function formatMoneyCompact(amount: number): string {
  return currencyFormatter.format(amount)
}

export function formatDate(iso: string): string {
  try {
    return dateFormatter.format(new Date(iso))
  } catch {
    return '—'
  }
}

export function formatDateTime(iso: string): string {
  try {
    return dateTimeFormatter.format(new Date(iso))
  } catch {
    return '—'
  }
}

export function formatTime(iso: string): string {
  try {
    return timeFormatter.format(new Date(iso))
  } catch {
    return '—'
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes.toLocaleString('fa-IR')} دقیقه`
  }
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) {
    return `${hours.toLocaleString('fa-IR')} ساعت`
  }
  return `${hours.toLocaleString('fa-IR')} ساعت و ${rest.toLocaleString('fa-IR')} دقیقه`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${fileSizeFormatter.format(bytes)} بایت`
  if (bytes < 1024 * 1024) {
    return `${fileSizeFormatter.format(bytes / 1024)} کیلوبایت`
  }
  return `${fileSizeFormatter.format(bytes / (1024 * 1024))} مگابایت`
}

export function formatMimeTypeLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'تصویر'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'سند Word'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'اکسل'
  if (mimeType.startsWith('text/')) return 'متن'
  return mimeType || 'نامشخص'
}

export function formatNumber(value: number): string {
  return value.toLocaleString('fa-IR')
}
