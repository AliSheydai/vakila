const currencyFormatter = new Intl.NumberFormat('fa-IR')

const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
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

const fileSizeFormatter = new Intl.NumberFormat('fa-IR', {
  maximumFractionDigits: 1,
})

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

