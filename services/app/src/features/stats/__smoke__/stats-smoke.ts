/**
 * Smoke tests for Statistics Phase 5.8
 * Run: npx tsx src/features/stats/__smoke__/stats-smoke.ts
 */

import type { Case, Client } from '../../cases/types'
import type { Event } from '../../events/types'
import {
  createStatisticsDateRange,
  createStatisticsPayload,
  listSuccessfulPaymentsInRange,
} from '../services/statistics-service'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

function isoDaysAgo(days: number, hour = 12): string {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function ymdDaysAgo(days: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const ownerId = 'smoke-owner'

const clients: Client[] = [
  {
    id: 'c1',
    name: 'موکل یک',
    phone: '09120000001',
    attachments: [],
    ownerId,
    createdAt: isoDaysAgo(2),
    updatedAt: isoDaysAgo(2),
  },
  {
    id: 'c2',
    name: 'موکل دو',
    phone: '09120000002',
    attachments: [],
    ownerId,
    createdAt: isoDaysAgo(40),
    updatedAt: isoDaysAgo(40),
  },
]

const cases: Case[] = [
  {
    id: 'case1',
    caseNumber: '1001',
    title: 'پرونده الف',
    description: '',
    legalArea: 'family',
    status: 'active',
    clientId: 'c1',
    ownerId,
    fee: null,
    payments: [
      {
        id: 'pay1',
        amount: 1_000_000,
        date: isoDaysAgo(1),
        method: 'cash',
        source: 'manual',
        status: 'completed',
        createdAt: isoDaysAgo(1),
        updatedAt: isoDaysAgo(1),
      },
      {
        id: 'pay2',
        amount: 500_000,
        date: isoDaysAgo(1),
        method: 'card',
        source: 'manual',
        status: 'pending',
        createdAt: isoDaysAgo(1),
        updatedAt: isoDaysAgo(1),
      },
      {
        id: 'pay3',
        amount: 200_000,
        date: isoDaysAgo(1),
        method: 'online',
        source: 'online',
        status: 'failed',
        createdAt: isoDaysAgo(1),
        updatedAt: isoDaysAgo(1),
      },
    ],
    expenses: [],
    attachments: [],
    createdAt: isoDaysAgo(3),
    updatedAt: isoDaysAgo(1),
  },
  {
    id: 'case2',
    caseNumber: '1002',
    title: 'پرونده ب',
    description: '',
    legalArea: 'criminal',
    status: 'closed',
    clientId: 'c2',
    ownerId,
    fee: null,
    payments: [],
    expenses: [],
    attachments: [],
    createdAt: isoDaysAgo(50),
    updatedAt: isoDaysAgo(5),
  },
]

const events: Event[] = [
  {
    id: 'e1',
    title: 'جلسه موکل',
    type: 'client_meeting',
    date: ymdDaysAgo(1),
    startTime: '10:00',
    endTime: '11:00',
    location: '',
    description: '',
    clientId: 'c1',
    caseId: 'case1',
    status: 'completed',
    ownerId,
    createdAt: isoDaysAgo(1),
    updatedAt: isoDaysAgo(1),
  },
  {
    id: 'e2',
    title: 'مهلت قانونی',
    type: 'legal_deadline',
    date: ymdDaysAgo(2),
    startTime: '09:00',
    endTime: '09:30',
    location: '',
    description: '',
    clientId: null,
    caseId: 'case1',
    status: 'scheduled',
    ownerId,
    createdAt: isoDaysAgo(2),
    updatedAt: isoDaysAgo(2),
  },
  {
    id: 'e3',
    title: 'جلسه لغو شده',
    type: 'online_meeting',
    date: ymdDaysAgo(3),
    startTime: '14:00',
    endTime: '15:00',
    location: '',
    description: '',
    clientId: 'c1',
    caseId: null,
    status: 'cancelled',
    ownerId,
    createdAt: isoDaysAgo(3),
    updatedAt: isoDaysAgo(3),
  },
]

function kpi(payload: ReturnType<typeof createStatisticsPayload>, metric: string) {
  const item = payload.kpis.find((entry) => entry.metric === metric)
  assert(Boolean(item), `KPI missing: ${metric}`)
  return item!
}

function testPresets() {
  const presets = [
    'today',
    'this_week',
    'this_month',
    'last_3_months',
    'this_year',
    'last_year',
  ] as const

  for (const preset of presets) {
    const range = createStatisticsDateRange(preset)
    assert(range.from.getTime() <= range.to.getTime(), `${preset}: invalid range`)
    const payload = createStatisticsPayload({ clients, cases, events }, range)
    assert(payload.hasAnyData === true, `${preset}: hasAnyData should be true`)
    assert(payload.kpis.length === 6, `${preset}: expected 6 KPIs`)
    assert(Array.isArray(payload.timeline), `${preset}: timeline missing`)
    assert(Array.isArray(payload.insights), `${preset}: insights missing`)
  }
}

function testCustomRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const range = createStatisticsDateRange('custom', { custom: { from, to } })
  assert(range.preset === 'custom', 'custom preset expected')
  const payload = createStatisticsPayload({ clients, cases, events }, range)
  assert(payload.range.preset === 'custom', 'payload custom range')
}

function testRevenueOnlyCompleted() {
  const range = createStatisticsDateRange('this_month')
  const payload = createStatisticsPayload({ clients, cases, events }, range)
  const revenue = kpi(payload, 'revenue')
  assert(revenue.value === 1_000_000, `revenue should ignore pending/failed, got ${revenue.value}`)
  assert(payload.payments.successfulCount === 1, 'successfulCount')
  assert(payload.payments.pendingCount === 1, 'pendingCount')
  assert(payload.payments.failedCount === 1, 'failedCount')
}

function testPreviousZeroComparison() {
  const range = createStatisticsDateRange('today')
  const emptyPreviousSources = {
    clients: [
      {
        ...clients[0],
        createdAt: isoDaysAgo(0),
        updatedAt: isoDaysAgo(0),
      },
    ],
    cases: [] as Case[],
    events: [] as Event[],
  }
  const payload = createStatisticsPayload(emptyPreviousSources, range)
  const newClients = kpi(payload, 'new_clients')
  assert(newClients.comparison.previous === 0, 'previous should be 0')
  assert(
    newClients.comparison.changePercent === null,
    'changePercent must be null when previous=0'
  )
}

function testNoFakeDataOnEmpty() {
  const range = createStatisticsDateRange('this_month')
  const payload = createStatisticsPayload(
    { clients: [], cases: [], events: [] },
    range
  )
  assert(payload.hasAnyData === false, 'empty sources => hasAnyData false')
  assert(
    payload.kpis.every((item) => item.value === 0),
    'empty sources should produce zero KPIs'
  )
  assert(payload.insights.length === 0, 'no insights without data')
  assert(
    payload.timeline.every(
      (point) =>
        point.revenue === 0 &&
        point.createdCases === 0 &&
        point.newClients === 0 &&
        point.events === 0
    ),
    'timeline must not invent values'
  )
}

function testEventAndCaseMetrics() {
  const range = createStatisticsDateRange('this_month')
  const payload = createStatisticsPayload({ clients, cases, events }, range)
  const sessions = kpi(payload, 'sessions')
  assert(sessions.value >= 2, 'session KPI should count meeting-like events')
  assert(payload.eventTypeBreakdown.some((item) => item.type === 'legal_deadline'), 'deadline breakdown')
  assert(payload.caseStatusBreakdown.some((item) => item.status === 'closed'), 'closed status')
  assert(payload.caseAreaBreakdown.some((item) => item.legalArea === 'family'), 'family area')
}

function testPaymentDrillRows() {
  const range = createStatisticsDateRange('this_month')
  const rows = listSuccessfulPaymentsInRange(cases, range)
  assert(rows.length === 1, 'only completed payments listed')
  assert(rows[0]?.caseId === 'case1', 'payment linked to case')
  assert(rows[0]?.amount === 1_000_000, 'payment amount')
}

function testInsightsAreDataBased() {
  const range = createStatisticsDateRange('this_month')
  const payload = createStatisticsPayload({ clients, cases, events }, range)
  for (const insight of payload.insights) {
    assert(insight.text.trim().length > 0, 'insight text empty')
    assert(!insight.text.includes('undefined'), 'insight has undefined')
  }
}

function main() {
  const tests = [
    ['presets', testPresets],
    ['custom-range', testCustomRange],
    ['revenue-completed-only', testRevenueOnlyCompleted],
    ['previous-zero', testPreviousZeroComparison],
    ['no-fake-empty', testNoFakeDataOnEmpty],
    ['event-case-metrics', testEventAndCaseMetrics],
    ['payment-rows', testPaymentDrillRows],
    ['insights', testInsightsAreDataBased],
  ] as const

  let passed = 0
  for (const [name, run] of tests) {
    run()
    passed += 1
    // eslint-disable-next-line no-console
    console.log(`PASS ${name}`)
  }

  // eslint-disable-next-line no-console
  console.log(`OK ${passed}/${tests.length} statistics smoke checks passed`)
}

main()
