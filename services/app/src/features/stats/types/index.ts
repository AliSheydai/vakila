import type { Case, Client, PaymentRecordStatus } from '@/features/cases/types'
import type { Event } from '@/features/events/types'

export type StatisticsPreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_3_months'
  | 'this_year'
  | 'last_year'
  | 'custom'

export type StatisticsDateRange = {
  preset: StatisticsPreset
  from: Date
  to: Date
}

export type StatisticsComparison = {
  current: number
  previous: number
  changePercent: number | null
  direction: 'up' | 'down' | 'flat'
}

export type KpiMetric =
  | 'new_clients'
  | 'created_cases'
  | 'closed_cases'
  | 'sessions'
  | 'revenue'
  | 'avg_revenue_per_session'

export type KpiValue = {
  metric: KpiMetric
  value: number
  comparison: StatisticsComparison
}

export type PaymentStatistics = {
  totalRevenue: number
  successfulCount: number
  pendingCount: number
  failedCount: number
  averageSuccessfulAmount: number
}

export type CaseStatusBreakdown = {
  status: Case['status']
  count: number
}

export type CaseAreaBreakdown = {
  legalArea: Case['legalArea']
  count: number
}

export type EventTypeBreakdown = {
  type: Event['type']
  count: number
}

export type StatisticsTimePoint = {
  label: string
  from: string
  to: string
  revenue: number
  createdCases: number
  newClients: number
  events: number
}

export type StatisticsInsightTone = 'positive' | 'negative' | 'neutral' | 'warning'

export type StatisticsInsight = {
  id: string
  text: string
  tone: StatisticsInsightTone
}

export type StatisticsPayload = {
  range: StatisticsDateRange
  previousRange: StatisticsDateRange
  hasAnyData: boolean
  kpis: KpiValue[]
  payments: PaymentStatistics
  caseStatusBreakdown: CaseStatusBreakdown[]
  caseAreaBreakdown: CaseAreaBreakdown[]
  eventTypeBreakdown: EventTypeBreakdown[]
  timeline: StatisticsTimePoint[]
  insights: StatisticsInsight[]
}

export type StatisticsDataSources = {
  clients: Client[]
  cases: Case[]
  events: Event[]
}

export type PaymentLike = {
  amount: number
  status: PaymentRecordStatus
  date: string
}
