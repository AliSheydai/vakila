import type { Case, Client } from '@/features/cases/types'
import type { Event } from '@/features/events/types'
import type {
  PaymentLike,
  StatisticsComparison,
  StatisticsDataSources,
  StatisticsDateRange,
  StatisticsPayload,
  StatisticsPaymentRow,
  StatisticsPreset,
  StatisticsTimePoint,
} from '../types'
import { buildStatisticsInsights } from './insights'

const SESSION_EVENT_TYPES: Event['type'][] = [
  'client_meeting',
  'online_meeting',
  'court_hearing',
]

const MS_IN_DAY = 24 * 60 * 60 * 1000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  )
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1)
}

function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999)
}

function parseIsoDate(value: string): Date | null {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function parseYmdDate(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function isInRange(date: Date, range: StatisticsDateRange): boolean {
  const stamp = date.getTime()
  return stamp >= range.from.getTime() && stamp <= range.to.getTime()
}

function buildComparison(current: number, previous: number): StatisticsComparison {
  if (previous === 0) {
    return {
      current,
      previous,
      changePercent: null,
      direction: current === 0 ? 'flat' : 'up',
    }
  }

  const changePercent = ((current - previous) / previous) * 100
  return {
    current,
    previous,
    changePercent,
    direction: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat',
  }
}

function getWeekStartSaturday(date: Date): Date {
  const value = startOfDay(date)
  const day = value.getDay()
  const saturdayOffset = (day + 1) % 7
  value.setDate(value.getDate() - saturdayOffset)
  return value
}

function getDateRangeFromPreset(
  preset: StatisticsPreset,
  now: Date = new Date(),
  custom?: { from: Date; to: Date }
): StatisticsDateRange {
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  if (preset === 'custom' && custom) {
    const from = startOfDay(custom.from)
    const to = endOfDay(custom.to)
    return { preset, from, to }
  }

  switch (preset) {
    case 'today':
      return { preset, from: todayStart, to: todayEnd }
    case 'this_week': {
      const from = getWeekStartSaturday(now)
      const to = endOfDay(new Date(from.getTime() + 6 * MS_IN_DAY))
      return { preset, from, to }
    }
    case 'this_month': {
      return {
        preset,
        from: startOfMonth(now),
        to: endOfMonth(now),
      }
    }
    case 'last_3_months': {
      const monthStart = startOfMonth(now)
      const from = new Date(monthStart.getFullYear(), monthStart.getMonth() - 2, 1)
      return { preset, from, to: endOfMonth(now) }
    }
    case 'this_year':
      return { preset, from: startOfYear(now), to: endOfYear(now) }
    case 'last_year': {
      const year = now.getFullYear() - 1
      return {
        preset,
        from: new Date(year, 0, 1),
        to: new Date(year, 11, 31, 23, 59, 59, 999),
      }
    }
    case 'custom':
    default:
      return { preset: 'today', from: todayStart, to: todayEnd }
  }
}

function getPreviousRange(range: StatisticsDateRange): StatisticsDateRange {
  const span = range.to.getTime() - range.from.getTime()
  const prevTo = new Date(range.from.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - span)
  return {
    preset: 'custom',
    from: prevFrom,
    to: prevTo,
  }
}

function countClientsInRange(clients: Client[], range: StatisticsDateRange): number {
  return clients.filter((item) => {
    const createdAt = parseIsoDate(item.createdAt)
    return createdAt ? isInRange(createdAt, range) : false
  }).length
}

function casesCreatedInRange(cases: Case[], range: StatisticsDateRange): Case[] {
  return cases.filter((item) => {
    const createdAt = parseIsoDate(item.createdAt)
    return createdAt ? isInRange(createdAt, range) : false
  })
}

function countClosedCasesInRange(cases: Case[], range: StatisticsDateRange): number {
  return cases.filter((item) => {
    if (item.status !== 'closed') return false
    const updatedAt = parseIsoDate(item.updatedAt)
    return updatedAt ? isInRange(updatedAt, range) : false
  }).length
}

function eventsInRange(events: Event[], range: StatisticsDateRange): Event[] {
  return events.filter((item) => {
    const eventDay = parseYmdDate(item.date)
    if (!eventDay) return false
    const stamp = startOfDay(eventDay)
    return isInRange(stamp, range)
  })
}

function countSessionsInRange(events: Event[], range: StatisticsDateRange): number {
  return eventsInRange(events, range).filter((item) =>
    SESSION_EVENT_TYPES.includes(item.type)
  ).length
}

function extractPayments(cases: Case[]): PaymentLike[] {
  return cases.flatMap((item) => item.payments)
}

function paymentsInRange(
  payments: PaymentLike[],
  range: StatisticsDateRange
): PaymentLike[] {
  return payments.filter((payment) => {
    const date = parseIsoDate(payment.date)
    return date ? isInRange(date, range) : false
  })
}

export function listSuccessfulPaymentsInRange(
  cases: Case[],
  range: StatisticsDateRange
): StatisticsPaymentRow[] {
  const rows: StatisticsPaymentRow[] = []

  for (const caseItem of cases) {
    for (const payment of caseItem.payments) {
      if (payment.status !== 'completed') continue
      const date = parseIsoDate(payment.date)
      if (!date || !isInRange(date, range)) continue
      rows.push({
        id: payment.id,
        caseId: caseItem.id,
        caseTitle: caseItem.title,
        amount: payment.amount,
        date: payment.date,
      })
    }
  }

  return rows.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

function computeTimeline(
  sources: StatisticsDataSources,
  range: StatisticsDateRange
): StatisticsTimePoint[] {
  const timeline: StatisticsTimePoint[] = []
  const totalDays = Math.max(
    1,
    Math.ceil((range.to.getTime() - range.from.getTime()) / MS_IN_DAY)
  )

  if (totalDays <= 62) {
    let cursor = startOfDay(range.from)
    while (cursor.getTime() <= range.to.getTime()) {
      const bucketFrom = startOfDay(cursor)
      const bucketTo = endOfDay(cursor)
      const bucketRange: StatisticsDateRange = {
        preset: 'custom',
        from: bucketFrom,
        to: bucketTo,
      }
      const payments = paymentsInRange(
        extractPayments(sources.cases),
        bucketRange
      ).filter((item) => item.status === 'completed')
      timeline.push({
        label: bucketFrom.toLocaleDateString('fa-IR'),
        from: bucketFrom.toISOString(),
        to: bucketTo.toISOString(),
        revenue: payments.reduce((sum, item) => sum + item.amount, 0),
        createdCases: casesCreatedInRange(sources.cases, bucketRange).length,
        newClients: countClientsInRange(sources.clients, bucketRange),
        events: eventsInRange(sources.events, bucketRange).length,
      })
      cursor = new Date(cursor.getTime() + MS_IN_DAY)
    }
    return timeline
  }

  let monthCursor = new Date(range.from.getFullYear(), range.from.getMonth(), 1)
  while (monthCursor.getTime() <= range.to.getTime()) {
    const bucketFrom = monthCursor
    const bucketTo = endOfMonth(monthCursor)
    const bucketRange: StatisticsDateRange = {
      preset: 'custom',
      from: bucketFrom,
      to: bucketTo,
    }
    const payments = paymentsInRange(
      extractPayments(sources.cases),
      bucketRange
    ).filter((item) => item.status === 'completed')
    timeline.push({
      label: monthCursor.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'short',
      }),
      from: bucketFrom.toISOString(),
      to: bucketTo.toISOString(),
      revenue: payments.reduce((sum, item) => sum + item.amount, 0),
      createdCases: casesCreatedInRange(sources.cases, bucketRange).length,
      newClients: countClientsInRange(sources.clients, bucketRange),
      events: eventsInRange(sources.events, bucketRange).length,
    })
    monthCursor = new Date(
      monthCursor.getFullYear(),
      monthCursor.getMonth() + 1,
      1
    )
  }

  return timeline
}

export function createStatisticsDateRange(
  preset: StatisticsPreset,
  options?: { now?: Date; custom?: { from: Date; to: Date } }
): StatisticsDateRange {
  return getDateRangeFromPreset(preset, options?.now, options?.custom)
}

export function createStatisticsPayload(
  sources: StatisticsDataSources,
  range: StatisticsDateRange
): StatisticsPayload {
  const previousRange = getPreviousRange(range)

  const currentClients = countClientsInRange(sources.clients, range)
  const previousClients = countClientsInRange(sources.clients, previousRange)

  const currentCreatedCases = casesCreatedInRange(sources.cases, range).length
  const previousCreatedCases = casesCreatedInRange(
    sources.cases,
    previousRange
  ).length

  const currentClosedCases = countClosedCasesInRange(sources.cases, range)
  const previousClosedCases = countClosedCasesInRange(sources.cases, previousRange)

  const currentSessions = countSessionsInRange(sources.events, range)
  const previousSessions = countSessionsInRange(sources.events, previousRange)

  const currentPayments = paymentsInRange(extractPayments(sources.cases), range)
  const previousPayments = paymentsInRange(
    extractPayments(sources.cases),
    previousRange
  )
  const currentSuccessfulPayments = currentPayments.filter(
    (item) => item.status === 'completed'
  )
  const previousSuccessfulPayments = previousPayments.filter(
    (item) => item.status === 'completed'
  )

  const currentRevenue = currentSuccessfulPayments.reduce(
    (sum, item) => sum + item.amount,
    0
  )
  const previousRevenue = previousSuccessfulPayments.reduce(
    (sum, item) => sum + item.amount,
    0
  )

  const currentAvgRevenuePerSession =
    currentSessions > 0 ? currentRevenue / currentSessions : 0
  const previousAvgRevenuePerSession =
    previousSessions > 0 ? previousRevenue / previousSessions : 0

  const eventsInCurrentRange = eventsInRange(sources.events, range)

  const payloadWithoutInsights: Omit<StatisticsPayload, 'insights'> = {
    range,
    previousRange,
    hasAnyData:
      sources.clients.length > 0 ||
      sources.cases.length > 0 ||
      sources.events.length > 0,
    kpis: [
      {
        metric: 'new_clients',
        value: currentClients,
        comparison: buildComparison(currentClients, previousClients),
      },
      {
        metric: 'created_cases',
        value: currentCreatedCases,
        comparison: buildComparison(currentCreatedCases, previousCreatedCases),
      },
      {
        metric: 'closed_cases',
        value: currentClosedCases,
        comparison: buildComparison(currentClosedCases, previousClosedCases),
      },
      {
        metric: 'sessions',
        value: currentSessions,
        comparison: buildComparison(currentSessions, previousSessions),
      },
      {
        metric: 'revenue',
        value: currentRevenue,
        comparison: buildComparison(currentRevenue, previousRevenue),
      },
      {
        metric: 'avg_revenue_per_session',
        value: currentAvgRevenuePerSession,
        comparison: buildComparison(
          currentAvgRevenuePerSession,
          previousAvgRevenuePerSession
        ),
      },
    ],
    payments: {
      totalRevenue: currentRevenue,
      successfulCount: currentSuccessfulPayments.length,
      pendingCount: currentPayments.filter((item) => item.status === 'pending')
        .length,
      failedCount: currentPayments.filter((item) => item.status === 'failed')
        .length,
      averageSuccessfulAmount:
        currentSuccessfulPayments.length > 0
          ? currentRevenue / currentSuccessfulPayments.length
          : 0,
    },
    caseStatusBreakdown: Array.from(
      sources.cases.reduce<Map<Case['status'], number>>((map, item) => {
        map.set(item.status, (map.get(item.status) ?? 0) + 1)
        return map
      }, new Map())
    ).map(([status, count]) => ({ status, count })),
    caseAreaBreakdown: Array.from(
      sources.cases.reduce<Map<Case['legalArea'], number>>((map, item) => {
        map.set(item.legalArea, (map.get(item.legalArea) ?? 0) + 1)
        return map
      }, new Map())
    ).map(([legalArea, count]) => ({ legalArea, count })),
    eventTypeBreakdown: Array.from(
      eventsInCurrentRange.reduce<Map<Event['type'], number>>((map, item) => {
        map.set(item.type, (map.get(item.type) ?? 0) + 1)
        return map
      }, new Map())
    ).map(([type, count]) => ({ type, count })),
    timeline: computeTimeline(sources, range),
  }

  return {
    ...payloadWithoutInsights,
    insights: buildStatisticsInsights(
      payloadWithoutInsights,
      eventsInCurrentRange
    ),
  }
}
