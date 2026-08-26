import {
  LEGAL_AREA_LABELS,
  type LegalArea,
} from '@/features/cases/types'
import type { Event } from '@/features/events/types'
import type {
  KpiValue,
  StatisticsInsight,
  StatisticsPayload,
} from '../types'
import { formatStatNumber } from '../utils/format'

const SESSION_EVENT_TYPES: Event['type'][] = [
  'client_meeting',
  'online_meeting',
  'court_hearing',
]

const WEEKDAY_LABELS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
] as const

function formatPercent(value: number): string {
  return formatStatNumber(Number(Math.abs(value).toFixed(1)))
}

function findKpi(kpis: KpiValue[], metric: KpiValue['metric']): KpiValue | undefined {
  return kpis.find((item) => item.metric === metric)
}

function pushChangeInsight(
  insights: StatisticsInsight[],
  kpi: KpiValue | undefined,
  labels: { up: string; down: string }
) {
  if (!kpi) return
  const { comparison } = kpi
  if (comparison.changePercent === null) return
  if (Math.abs(comparison.changePercent) < 1) return
  if (comparison.previous <= 0) return

  const percent = formatPercent(comparison.changePercent)
  if (comparison.direction === 'up') {
    insights.push({
      id: `${kpi.metric}-up`,
      tone: 'positive',
      text: labels.up.replace('{percent}', percent),
    })
  } else if (comparison.direction === 'down') {
    insights.push({
      id: `${kpi.metric}-down`,
      tone: 'negative',
      text: labels.down.replace('{percent}', percent),
    })
  }
}

function busiestSessionWeekday(events: Event[]): StatisticsInsight | null {
  const sessions = events.filter((item) =>
    SESSION_EVENT_TYPES.includes(item.type)
  )
  if (sessions.length < 3) return null

  const counts = new Array(7).fill(0) as number[]
  for (const event of sessions) {
    const [year, month, day] = event.date.split('-').map(Number)
    if (!year || !month || !day) continue
    const weekday = new Date(year, month - 1, day).getDay()
    counts[weekday] += 1
  }

  let maxIndex = 0
  for (let i = 1; i < counts.length; i += 1) {
    if (counts[i] > counts[maxIndex]) maxIndex = i
  }

  if (counts[maxIndex] <= 0) return null

  return {
    id: 'busiest-session-weekday',
    tone: 'neutral',
    text: `بیشترین تعداد جلسات شما در روزهای ${WEEKDAY_LABELS[maxIndex]} ثبت شده است (${formatStatNumber(counts[maxIndex])} جلسه).`,
  }
}

function dominantCaseArea(
  payload: Pick<StatisticsPayload, 'caseAreaBreakdown'>
): StatisticsInsight | null {
  const items = payload.caseAreaBreakdown.filter((item) => item.count > 0)
  if (items.length === 0) return null

  const total = items.reduce((sum, item) => sum + item.count, 0)
  if (total < 2) return null

  const top = [...items].sort((a, b) => b.count - a.count)[0]
  if (!top) return null

  const percent = Math.round((top.count / total) * 100)
  if (percent < 30) return null

  const label =
    LEGAL_AREA_LABELS[top.legalArea as LegalArea] ?? top.legalArea

  return {
    id: 'dominant-case-area',
    tone: 'neutral',
    text: `بیشترین سهم پرونده‌های شما مربوط به حوزه ${label} است (${formatStatNumber(percent)}٪).`,
  }
}

function legalDeadlineInsight(
  events: Event[]
): StatisticsInsight | null {
  const deadlines = events.filter((item) => item.type === 'legal_deadline')
  if (deadlines.length === 0) return null

  return {
    id: 'legal-deadlines',
    tone: 'warning',
    text: `در این بازه ${formatStatNumber(deadlines.length)} مهلت قانونی ثبت شده است.`,
  }
}

function sessionCompletionInsight(events: Event[]): StatisticsInsight | null {
  const sessions = events.filter((item) =>
    SESSION_EVENT_TYPES.includes(item.type)
  )
  const decided = sessions.filter(
    (item) => item.status === 'completed' || item.status === 'cancelled'
  )
  if (decided.length < 3) return null

  const completed = decided.filter((item) => item.status === 'completed').length
  const rate = Math.round((completed / decided.length) * 100)

  return {
    id: 'session-completion-rate',
    tone: rate >= 70 ? 'positive' : rate >= 40 ? 'neutral' : 'warning',
    text: `نرخ برگزاری جلسات در این بازه ${formatStatNumber(rate)}٪ بوده است.`,
  }
}

/**
 * Insightهای ساده و rule-based — فقط وقتی داده کافی باشد.
 */
export function buildStatisticsInsights(
  payload: Omit<StatisticsPayload, 'insights'>,
  eventsInRange: Event[]
): StatisticsInsight[] {
  const insights: StatisticsInsight[] = []

  pushChangeInsight(insights, findKpi(payload.kpis, 'new_clients'), {
    up: 'در این بازه {percent}٪ موکل جدید بیشتری نسبت به دوره قبل داشته‌اید.',
    down: 'تعداد موکلین جدید نسبت به دوره قبل {percent}٪ کمتر شده است.',
  })

  pushChangeInsight(insights, findKpi(payload.kpis, 'revenue'), {
    up: 'درآمد این بازه نسبت به دوره قبل {percent}٪ افزایش داشته است.',
    down: 'درآمد این بازه نسبت به دوره قبل {percent}٪ کاهش داشته است.',
  })

  pushChangeInsight(insights, findKpi(payload.kpis, 'created_cases'), {
    up: 'پرونده‌های جدید نسبت به دوره قبل {percent}٪ بیشتر شده‌اند.',
    down: 'پرونده‌های جدید نسبت به دوره قبل {percent}٪ کمتر شده‌اند.',
  })

  pushChangeInsight(insights, findKpi(payload.kpis, 'sessions'), {
    up: 'تعداد جلسات نسبت به دوره قبل {percent}٪ افزایش یافته است.',
    down: 'تعداد جلسات نسبت به دوره قبل {percent}٪ کاهش یافته است.',
  })

  const weekday = busiestSessionWeekday(eventsInRange)
  if (weekday) insights.push(weekday)

  const area = dominantCaseArea(payload)
  if (area) insights.push(area)

  const deadlines = legalDeadlineInsight(eventsInRange)
  if (deadlines) insights.push(deadlines)

  const completion = sessionCompletionInsight(eventsInRange)
  if (completion) insights.push(completion)

  return insights.slice(0, 5)
}
