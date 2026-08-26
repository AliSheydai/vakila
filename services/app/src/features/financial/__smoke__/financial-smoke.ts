/**
 * Smoke tests for Financial Phase 6.2 (domain layer)
 * Run: npx tsx src/features/financial/__smoke__/financial-smoke.ts
 */

import type { Case, Client } from '../../cases/types'
import {
  buildFinancialLedger,
  createFinancialDateRange,
  createFinancialPayload,
  filterFinancialTransactions,
} from '../services/financial-service'
import { DEFAULT_TAX_CONFIG } from '../services/tax'
import { DEFAULT_FINANCIAL_FILTERS } from '../types'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

function isoDaysAgo(days: number, hour = 12): string {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const ownerId = 'financial-smoke-owner'
const now = new Date()

const clients: Client[] = [
  {
    id: 'c1',
    name: 'علی رضایی',
    phone: '09120000001',
    attachments: [],
    ownerId,
    createdAt: isoDaysAgo(30),
    updatedAt: isoDaysAgo(30),
  },
  {
    id: 'c2',
    name: 'مریم احمدی',
    phone: '09120000002',
    attachments: [],
    ownerId,
    createdAt: isoDaysAgo(20),
    updatedAt: isoDaysAgo(20),
  },
]

const cases: Case[] = [
  {
    id: 'case1',
    caseNumber: '1404-001',
    title: 'پرونده خانواده',
    description: '',
    legalArea: 'family',
    status: 'active',
    clientId: 'c1',
    ownerId,
    fee: {
      id: 'fee1',
      amount: 10_000_000,
      createdAt: isoDaysAgo(25),
      updatedAt: isoDaysAgo(25),
    },
    payments: [
      {
        id: 'pay-completed',
        amount: 2_000_000,
        date: isoDaysAgo(2),
        method: 'transfer',
        source: 'manual',
        status: 'completed',
        description: 'پیش‌پرداخت',
        createdAt: isoDaysAgo(2),
        updatedAt: isoDaysAgo(2),
      },
      {
        id: 'pay-pending',
        amount: 500_000,
        date: isoDaysAgo(1),
        method: 'online',
        source: 'online',
        status: 'pending',
        createdAt: isoDaysAgo(1),
        updatedAt: isoDaysAgo(1),
      },
      {
        id: 'pay-failed',
        amount: 300_000,
        date: isoDaysAgo(1),
        method: 'card',
        source: 'online',
        status: 'failed',
        createdAt: isoDaysAgo(1),
        updatedAt: isoDaysAgo(1),
      },
      {
        id: 'pay-old',
        amount: 1_000_000,
        date: isoDaysAgo(100),
        method: 'cash',
        source: 'manual',
        status: 'completed',
        createdAt: isoDaysAgo(100),
        updatedAt: isoDaysAgo(100),
      },
    ],
    expenses: [
      {
        id: 'exp1',
        title: 'هزینه کارشناسی',
        category: 'expert',
        amount: 200_000,
        date: isoDaysAgo(3),
        description: 'کارشناس رسمی',
        createdAt: isoDaysAgo(3),
        updatedAt: isoDaysAgo(3),
      },
    ],
    attachments: [],
    createdAt: isoDaysAgo(25),
    updatedAt: isoDaysAgo(2),
  },
  {
    id: 'case2',
    caseNumber: '1404-002',
    title: 'پرونده تجاری',
    description: '',
    legalArea: 'commercial',
    status: 'active',
    clientId: 'c2',
    ownerId,
    fee: {
      id: 'fee2',
      amount: 5_000_000,
      createdAt: isoDaysAgo(10),
      updatedAt: isoDaysAgo(10),
    },
    payments: [
      {
        id: 'pay2',
        amount: 5_000_000,
        date: isoDaysAgo(5),
        method: 'cheque',
        source: 'manual',
        status: 'completed',
        createdAt: isoDaysAgo(5),
        updatedAt: isoDaysAgo(5),
      },
    ],
    expenses: [],
    attachments: [],
    createdAt: isoDaysAgo(10),
    updatedAt: isoDaysAgo(5),
  },
]

function run() {
  const range = createFinancialDateRange('this_month', { now })
  const payload = createFinancialPayload({ cases, clients }, range)

  assert(payload.hasAnyData, 'expected hasAnyData')
  assert(payload.taxConfig.rate === DEFAULT_TAX_CONFIG.rate, 'tax rate mismatch')

  // Gross: only completed in range (2M + 5M); exclude pending/failed/old
  assert(
    payload.summary.grossRevenue === 7_000_000,
    `gross expected 7000000 got ${payload.summary.grossRevenue}`
  )

  // Tax 9% of gross
  assert(
    payload.summary.taxTotal === 630_000,
    `tax expected 630000 got ${payload.summary.taxTotal}`
  )
  assert(
    payload.summary.netRevenue === 6_370_000,
    `net expected 6370000 got ${payload.summary.netRevenue}`
  )

  // Expenses in range
  assert(
    payload.summary.expensesTotal === 200_000,
    `expenses expected 200000 got ${payload.summary.expensesTotal}`
  )

  // Profit = net - expenses
  assert(
    payload.summary.profit === 6_170_000,
    `profit expected 6170000 got ${payload.summary.profit}`
  )

  // Receivables snapshot: case1 = 10M - (2M+1M) = 7M; case2 = 0
  assert(
    payload.summary.receivables === 7_000_000,
    `receivables expected 7000000 got ${payload.summary.receivables}`
  )

  const receivablesKpi = payload.kpis.find((k) => k.key === 'receivables')
  assert(!!receivablesKpi?.isSnapshot, 'receivables should be snapshot KPI')

  // Pending/failed appear in ledger/range but not in revenue counts as successful
  assert(payload.summary.successfulPaymentCount === 2, 'successful count')
  assert(payload.summary.pendingPaymentCount === 1, 'pending count')
  assert(payload.summary.failedPaymentCount === 1, 'failed count')

  const ledger = buildFinancialLedger({ cases, clients })
  // case1: 4 payments + 1 expense; case2: 1 payment
  assert(ledger.length === 6, `ledger length expected 6 got ${ledger.length}`)

  const aliRows = filterFinancialTransactions(ledger, {
    ...DEFAULT_FINANCIAL_FILTERS,
    query: 'علی',
  })
  assert(aliRows.length === 5, `query علی expected 5 got ${aliRows.length}`)

  const expensesOnly = filterFinancialTransactions(payload.transactions, {
    ...DEFAULT_FINANCIAL_FILTERS,
    kind: 'expense',
  })
  // re-filter from range payload path
  const expensePayload = createFinancialPayload(
    { cases, clients },
    range,
    { ...DEFAULT_FINANCIAL_FILTERS, kind: 'expense' }
  )
  assert(
    expensePayload.transactions.length === 1,
    'expense filter should yield 1'
  )
  assert(expensesOnly.length >= 0, 'sanity')

  const emptyFilter = createFinancialPayload(
    { cases, clients },
    range,
    { ...DEFAULT_FINANCIAL_FILTERS, query: 'چیزی‌که‌نیست' }
  )
  assert(emptyFilter.transactions.length === 0, 'filtered empty')
  assert(emptyFilter.summary.grossRevenue === 7_000_000, 'KPI ignores table query')

  // completed payment tax on transaction row
  const completed = payload.transactions.find(
    (t) => t.sourceRef === 'pay-completed'
  )
  assert(!!completed, 'completed payment in filtered list')
  assert(completed!.taxAmount === 180_000, 'payment tax 9% of 2M')
  assert(completed!.netAmount === 1_820_000, 'payment net')

  const pending = payload.transactions.find((t) => t.sourceRef === 'pay-pending')
  assert(!!pending, 'pending visible in table')
  assert(pending!.taxAmount === 0, 'pending has no tax')

  assert(payload.timeline.length > 0, 'timeline non-empty')
  assert(payload.exportPayload.transactions.length > 0, 'export payload ready')

  // Empty system
  const empty = createFinancialPayload({ cases: [], clients: [] }, range)
  assert(!empty.hasAnyData, 'empty system hasAnyData false')
  assert(empty.summary.grossRevenue === 0, 'empty gross')

  console.log('financial-smoke: all assertions passed')
}

run()
