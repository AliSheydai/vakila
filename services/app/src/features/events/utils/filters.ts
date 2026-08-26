import type {
  Event,
  EventFilters,
  EventSearchContext,
  EventTemporalStatus,
} from '../types'
import {
  compareEventsByStart,
  getTemporalStatus,
  toDateKey,
} from './datetime'

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

export function matchesEventSearch(
  event: Event,
  query: string,
  context: EventSearchContext = {}
): boolean {
  const q = normalizeQuery(query)
  if (!q) return true

  const clientName =
    event.clientId && context.clientNameById
      ? context.clientNameById[event.clientId] ?? ''
      : ''
  const caseTitle =
    event.caseId && context.caseTitleById
      ? context.caseTitleById[event.caseId] ?? ''
      : ''

  const haystack = [
    event.title,
    event.description,
    event.location,
    clientName,
    caseTitle,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(q)
}

export function filterEvents(
  events: Event[],
  filters: EventFilters = {},
  context: EventSearchContext = {}
): Event[] {
  const now = filters.now ?? new Date()
  const type = filters.type ?? 'all'
  const temporal = filters.temporal ?? 'all'
  const relation = filters.relation ?? 'all'

  return events
    .filter((event) => {
      if (type !== 'all' && event.type !== type) return false

      if (temporal !== 'all') {
        const status: EventTemporalStatus = getTemporalStatus(event, now)
        if (status !== temporal) return false
      }

      if (relation === 'with_case' && !event.caseId) return false
      if (relation === 'with_client' && !event.clientId) return false

      if (filters.caseId && event.caseId !== filters.caseId) return false
      if (filters.clientId && event.clientId !== filters.clientId) return false

      if (filters.query && !matchesEventSearch(event, filters.query, context)) {
        return false
      }

      return true
    })
    .slice()
    .sort(compareEventsByStart)
}

export function getEventsByDate(
  events: Event[],
  date: string
): Event[] {
  return events
    .filter((event) => event.date === date)
    .slice()
    .sort(compareEventsByStart)
}

export function getEventsByCase(events: Event[], caseId: string): Event[] {
  return events
    .filter((event) => event.caseId === caseId)
    .slice()
    .sort(compareEventsByStart)
}

export function getEventsByClient(
  events: Event[],
  clientId: string
): Event[] {
  return events
    .filter((event) => event.clientId === clientId)
    .slice()
    .sort(compareEventsByStart)
}

export function getTodayEvents(
  events: Event[],
  now: Date = new Date()
): Event[] {
  return getEventsByDate(events, toDateKey(now))
}

export function getUpcomingEvents(
  events: Event[],
  now: Date = new Date()
): Event[] {
  const todayKey = toDateKey(now)
  return events
    .filter((event) => event.date > todayKey)
    .slice()
    .sort(compareEventsByStart)
}

export function getPastEvents(
  events: Event[],
  now: Date = new Date()
): Event[] {
  const todayKey = toDateKey(now)
  return events
    .filter((event) => event.date < todayKey)
    .slice()
    .sort((a, b) => compareEventsByStart(b, a))
}

/** رویدادهای امروز تا پایان هفته محلی (شامل امروز) */
export function getThisWeekEvents(
  events: Event[],
  now: Date = new Date()
): Event[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = start.getDay()
  /** شنبه به‌عنوان شروع هفته در تقویم محلی ایران */
  const saturdayOffset = (day + 1) % 7
  start.setDate(start.getDate() - saturdayOffset)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const startKey = toDateKey(start)
  const endKey = toDateKey(end)

  return events
    .filter((event) => event.date >= startKey && event.date <= endKey)
    .slice()
    .sort(compareEventsByStart)
}

export type EventsSummary = {
  today: number
  thisWeek: number
  upcoming: number
  past: number
}

export function summarizeEvents(
  events: Event[],
  now: Date = new Date()
): EventsSummary {
  return {
    today: getTodayEvents(events, now).length,
    thisWeek: getThisWeekEvents(events, now).length,
    upcoming: getUpcomingEvents(events, now).length,
    past: getPastEvents(events, now).length,
  }
}
