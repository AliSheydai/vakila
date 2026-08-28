const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function formatRelativeTimeFa(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  if (diffMs < MINUTE) return 'همین الان'

  const minutes = Math.floor(diffMs / MINUTE)
  if (minutes < 60) {
    return `${minutes.toLocaleString('fa-IR')} دقیقه پیش`
  }

  const hours = Math.floor(diffMs / HOUR)
  if (hours < 24) {
    return `${hours.toLocaleString('fa-IR')} ساعت پیش`
  }

  const days = Math.floor(diffMs / DAY)
  if (days < 7) {
    return `${days.toLocaleString('fa-IR')} روز پیش`
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
