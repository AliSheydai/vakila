import type { Event, EventTemporalStatus } from '../types'

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

const weekdayFormatter = new Intl.DateTimeFormat('fa-IR', {
  weekday: 'long',
})

/** ترکیب تاریخ YYYY-MM-DD و ساعت HH:mm به Date محلی */
export function combineDateAndTime(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, 0, 0)
}

export function getEventStart(event: Pick<Event, 'date' | 'startTime'>): Date {
  return combineDateAndTime(event.date, event.startTime)
}

export function getEventEnd(event: Pick<Event, 'date' | 'endTime'>): Date {
  return combineDateAndTime(event.date, event.endTime)
}

/** مدت رویداد به دقیقه؛ اگر پایان قبل از شروع باشد null */
export function getEventDurationMinutes(
  event: Pick<Event, 'date' | 'startTime' | 'endTime'>
): number | null {
  const start = getEventStart(event).getTime()
  const end = getEventEnd(event).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null
  return Math.round((end - start) / 60_000)
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getTemporalStatus(
  event: Pick<Event, 'date'>,
  now: Date = new Date()
): EventTemporalStatus {
  const eventDay = startOfLocalDay(combineDateAndTime(event.date, '00:00'))
  const today = startOfLocalDay(now)
  const diff = eventDay.getTime() - today.getTime()
  if (diff === 0) return 'today'
  if (diff > 0) return 'upcoming'
  return 'past'
}

export function isImportantEventType(
  type: Event['type']
): boolean {
  return type === 'legal_deadline' || type === 'court_hearing'
}

export function formatEventDate(date: string): string {
  try {
    return dateFormatter.format(combineDateAndTime(date, '00:00'))
  } catch {
    return '—'
  }
}

export function formatEventTime(time: string): string {
  try {
    return timeFormatter.format(combineDateAndTime('2000-01-01', time))
  } catch {
    return time
  }
}

export function formatEventDateTime(event: Pick<Event, 'date' | 'startTime'>): string {
  try {
    return dateTimeFormatter.format(getEventStart(event))
  } catch {
    return '—'
  }
}

export function formatEventWeekday(date: string): string {
  try {
    return weekdayFormatter.format(combineDateAndTime(date, '00:00'))
  } catch {
    return '—'
  }
}

export function formatEventDuration(minutes: number | null): string {
  if (minutes === null) return '—'
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

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatEventTime(startTime)} – ${formatEventTime(endTime)}`
}

/** مقایسه برای مرتب‌سازی زمانی صعودی */
export function compareEventsByStart(
  a: Pick<Event, 'date' | 'startTime'>,
  b: Pick<Event, 'date' | 'startTime'>
): number {
  return getEventStart(a).getTime() - getEventStart(b).getTime()
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + amount)
  return next
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

/** شروع هفته محلی ایران (شنبه) */
export function startOfWeekSaturday(date: Date): Date {
  const start = startOfLocalDay(date)
  const day = start.getDay()
  const saturdayOffset = (day + 1) % 7
  return addDays(start, -saturdayOffset)
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeekSaturday(anchor)
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

/** شبکه ماه با شروع از شنبه (۶ هفته × ۷ روز) */
export function getMonthGrid(anchor: Date): Date[] {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const gridStart = startOfWeekSaturday(firstOfMonth)
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index))
}

const monthTitleFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'long',
})

const weekdayShortFormatter = new Intl.DateTimeFormat('fa-IR', {
  weekday: 'short',
})

const dayNumberFormatter = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
})

export function formatMonthTitle(date: Date): string {
  return monthTitleFormatter.format(date)
}

export function formatWeekdayShort(date: Date): string {
  return weekdayShortFormatter.format(date)
}

export function formatDayNumber(date: Date): string {
  return dayNumberFormatter.format(date)
}

export function formatWeekRangeLabel(anchor: Date): string {
  const days = getWeekDays(anchor)
  const first = days[0]
  const last = days[6]
  if (!first || !last) return '—'
  return `${formatEventDate(toDateKey(first))} تا ${formatEventDate(toDateKey(last))}`
}

export function getDateTemporalStatus(
  dateKey: string,
  now: Date = new Date()
): EventTemporalStatus {
  return getTemporalStatus({ date: dateKey }, now)
}
