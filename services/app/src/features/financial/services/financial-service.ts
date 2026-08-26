import type {
  Case,
  Client,
  Expense,
  Payment,
} from '@/features/cases/types'
import { getRemaining } from '@/features/cases/utils/finance'
import {
  calculatePaymentTax,
  DEFAULT_TAX_CONFIG,
  roundMoney,
} from './tax'
import type {
  FinancialComparison,
  FinancialDataSources,
  FinancialDateRange,
  FinancialExportPayload,
  FinancialFilters,
  FinancialKpi,
  FinancialPayload,
  FinancialPreset,
  FinancialSummary,
  FinancialTimePoint,
  FinancialTransaction,
  TaxConfig,
} from '../types'
import { DEFAULT_FINANCIAL_FILTERS } from '../types'

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

function isInRange(date: Date, range: FinancialDateRange): boolean {
  const stamp = date.getTime()
  return stamp >= range.from.getTime() && stamp <= range.to.getTime()
}

function getWeekStartSaturday(date: Date): Date {
  const value = startOfDay(date)
  const day = value.getDay()
  const saturdayOffset = (day + 1) % 7
  value.setDate(value.getDate() - saturdayOffset)
  return value
}

function getDateRangeFromPreset(
  preset: FinancialPreset,
  now: Date = new Date(),
  custom?: { from: Date; to: Date }
): FinancialDateRange {
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  if (preset === 'custom' && custom) {
    return {
      preset,
      from: startOfDay(custom.from),
      to: endOfDay(custom.to),
    }
  }

  switch (preset) {
    case 'today':
      return { preset, from: todayStart, to: todayEnd }
    case 'this_week': {
      const from = getWeekStartSaturday(now)
      const to = endOfDay(new Date(from.getTime() + 6 * MS_IN_DAY))
      return { preset, from, to }
    }
    case 'this_month':
      return {
        preset,
        from: startOfMonth(now),
        to: endOfMonth(now),
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

function getPreviousRange(range: FinancialDateRange): FinancialDateRange {
  const span = range.to.getTime() - range.from.getTime()
  const prevTo = new Date(range.from.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - span)
  return {
    preset: 'custom',
    from: prevFrom,
    to: prevTo,
  }
}

function buildComparison(current: number, previous: number): FinancialComparison {
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

function clientNameMap(clients: Client[]): Map<string, string> {
  return new Map(clients.map((client) => [client.id, client.name]))
}

function paymentToTransaction(
  caseItem: Case,
  payment: Payment,
  clientName: string | null | undefined,
  taxConfig: TaxConfig
): FinancialTransaction {
  const isCompleted = payment.status === 'completed'
  const { taxAmount, netAmount } = calculatePaymentTax(
    payment.amount,
    isCompleted,
    taxConfig
  )

  return {
    id: `payment:${caseItem.id}:${payment.id}`,
    kind: 'payment',
    direction: 'inflow',
    amount: payment.amount,
    taxAmount: isCompleted ? taxAmount : 0,
    netAmount: isCompleted ? netAmount : payment.amount,
    date: payment.date,
    status: payment.status,
    method: payment.method,
    description: payment.description,
    caseId: caseItem.id,
    caseTitle: caseItem.title,
    caseNumber: caseItem.caseNumber,
    clientId: caseItem.clientId,
    clientName: clientName ?? null,
    sourceRef: payment.id,
  }
}

function expenseToTransaction(
  caseItem: Case,
  expense: Expense,
  clientName: string | null | undefined
): FinancialTransaction {
  return {
    id: `expense:${caseItem.id}:${expense.id}`,
    kind: 'expense',
    direction: 'outflow',
    amount: expense.amount,
    taxAmount: 0,
    netAmount: expense.amount,
    date: expense.date,
    category: expense.category,
    description: expense.description ?? expense.title,
    caseId: caseItem.id,
    caseTitle: caseItem.title,
    caseNumber: caseItem.caseNumber,
    clientId: caseItem.clientId,
    clientName: clientName ?? null,
    sourceRef: expense.id,
  }
}

/** Build full ledger from cases — not date-filtered. */
export function buildFinancialLedger(
  sources: FinancialDataSources,
  taxConfig: TaxConfig = DEFAULT_TAX_CONFIG
): FinancialTransaction[] {
  const names = clientNameMap(sources.clients)
  const rows: FinancialTransaction[] = []

  for (const caseItem of sources.cases) {
    const clientName = caseItem.clientId
      ? names.get(caseItem.clientId) ?? null
      : null

    for (const payment of caseItem.payments) {
      rows.push(paymentToTransaction(caseItem, payment, clientName, taxConfig))
    }
    for (const expense of caseItem.expenses) {
      rows.push(expenseToTransaction(caseItem, expense, clientName))
    }
  }

  return rows.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function filterTransactionsByRange(
  transactions: FinancialTransaction[],
  range: FinancialDateRange
): FinancialTransaction[] {
  return transactions.filter((row) => {
    const date = parseIsoDate(row.date)
    return date ? isInRange(date, range) : false
  })
}

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase()
}

export function filterFinancialTransactions(
  transactions: FinancialTransaction[],
  filters: FinancialFilters = DEFAULT_FINANCIAL_FILTERS
): FinancialTransaction[] {
  const query = normalizeQuery(filters.query)

  return transactions.filter((row) => {
    if (filters.kind !== 'all' && row.kind !== filters.kind) return false

    if (filters.paymentStatus !== 'all') {
      if (row.kind !== 'payment') return false
      if (row.status !== filters.paymentStatus) return false
    }

    if (filters.method !== 'all') {
      if (row.kind !== 'payment' || row.method !== filters.method) return false
    }

    if (filters.category !== 'all') {
      if (row.kind !== 'expense' || row.category !== filters.category) {
        return false
      }
    }

    if (filters.clientId !== 'all' && row.clientId !== filters.clientId) {
      return false
    }

    if (filters.caseId !== 'all' && row.caseId !== filters.caseId) {
      return false
    }

    if (query) {
      const haystack = [
        row.caseTitle,
        row.caseNumber,
        row.clientName ?? '',
        row.description ?? '',
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }

    return true
  })
}

export function computeReceivables(cases: Case[]): number {
  return cases.reduce((sum, item) => sum + getRemaining(item), 0)
}

export function computeFinancialSummary(
  rangeTransactions: FinancialTransaction[],
  cases: Case[],
  taxConfig: TaxConfig = DEFAULT_TAX_CONFIG
): FinancialSummary {
  const completedPayments = rangeTransactions.filter(
    (row) => row.kind === 'payment' && row.status === 'completed'
  )
  const pendingPayments = rangeTransactions.filter(
    (row) => row.kind === 'payment' && row.status === 'pending'
  )
  const failedPayments = rangeTransactions.filter(
    (row) => row.kind === 'payment' && row.status === 'failed'
  )
  const expenses = rangeTransactions.filter((row) => row.kind === 'expense')

  const grossRevenue = roundMoney(
    completedPayments.reduce((sum, row) => sum + row.amount, 0)
  )
  const taxTotal = roundMoney(
    completedPayments.reduce((sum, row) => sum + row.taxAmount, 0)
  )
  const netRevenue = roundMoney(grossRevenue - taxTotal)
  const expensesTotal = roundMoney(
    expenses.reduce((sum, row) => sum + row.amount, 0)
  )
  const profit = roundMoney(netRevenue - expensesTotal)

  return {
    grossRevenue,
    taxTotal,
    netRevenue,
    expensesTotal,
    profit,
    receivables: computeReceivables(cases),
    successfulPaymentCount: completedPayments.length,
    pendingPaymentCount: pendingPayments.length,
    failedPaymentCount: failedPayments.length,
    expenseCount: expenses.length,
    averageSuccessfulPayment:
      completedPayments.length > 0
        ? roundMoney(grossRevenue / completedPayments.length)
        : 0,
    expenseToRevenueRatio:
      grossRevenue > 0 ? expensesTotal / grossRevenue : null,
    taxRate: taxConfig.rate,
  }
}

function buildKpis(
  current: FinancialSummary,
  previous: FinancialSummary
): FinancialKpi[] {
  return [
    {
      key: 'gross_revenue',
      value: current.grossRevenue,
      comparison: buildComparison(current.grossRevenue, previous.grossRevenue),
    },
    {
      key: 'tax_total',
      value: current.taxTotal,
      comparison: buildComparison(current.taxTotal, previous.taxTotal),
    },
    {
      key: 'net_revenue',
      value: current.netRevenue,
      comparison: buildComparison(current.netRevenue, previous.netRevenue),
    },
    {
      key: 'expenses_total',
      value: current.expensesTotal,
      comparison: buildComparison(current.expensesTotal, previous.expensesTotal),
    },
    {
      key: 'profit',
      value: current.profit,
      comparison: buildComparison(current.profit, previous.profit),
    },
    {
      key: 'receivables',
      value: current.receivables,
      isSnapshot: true,
    },
  ]
}

function computeTimeline(
  rangeTransactions: FinancialTransaction[],
  range: FinancialDateRange
): FinancialTimePoint[] {
  const timeline: FinancialTimePoint[] = []
  const totalDays = Math.max(
    1,
    Math.ceil((range.to.getTime() - range.from.getTime()) / MS_IN_DAY)
  )

  const pushBucket = (bucketFrom: Date, bucketTo: Date, label: string) => {
    const bucketRange: FinancialDateRange = {
      preset: 'custom',
      from: bucketFrom,
      to: bucketTo,
    }
    const inBucket = filterTransactionsByRange(rangeTransactions, bucketRange)
    const inflow = roundMoney(
      inBucket
        .filter((row) => row.kind === 'payment' && row.status === 'completed')
        .reduce((sum, row) => sum + row.amount, 0)
    )
    const outflow = roundMoney(
      inBucket
        .filter((row) => row.kind === 'expense')
        .reduce((sum, row) => sum + row.amount, 0)
    )
    timeline.push({
      label,
      from: bucketFrom.toISOString(),
      to: bucketTo.toISOString(),
      inflow,
      outflow,
      net: roundMoney(inflow - outflow),
    })
  }

  if (totalDays <= 62) {
    let cursor = startOfDay(range.from)
    while (cursor.getTime() <= range.to.getTime()) {
      const bucketFrom = startOfDay(cursor)
      const bucketTo = endOfDay(cursor)
      pushBucket(bucketFrom, bucketTo, bucketFrom.toLocaleDateString('fa-IR'))
      cursor = new Date(cursor.getTime() + MS_IN_DAY)
    }
    return timeline
  }

  let monthCursor = new Date(range.from.getFullYear(), range.from.getMonth(), 1)
  while (monthCursor.getTime() <= range.to.getTime()) {
    const bucketFrom = monthCursor
    const bucketTo = endOfMonth(monthCursor)
    pushBucket(
      bucketFrom,
      bucketTo,
      monthCursor.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'short',
      })
    )
    monthCursor = new Date(
      monthCursor.getFullYear(),
      monthCursor.getMonth() + 1,
      1
    )
  }

  return timeline
}

export function createFinancialDateRange(
  preset: FinancialPreset,
  options?: { now?: Date; custom?: { from: Date; to: Date } }
): FinancialDateRange {
  return getDateRangeFromPreset(preset, options?.now, options?.custom)
}

export function createFinancialExportPayload(
  range: FinancialDateRange,
  summary: FinancialSummary,
  transactions: FinancialTransaction[],
  taxConfig: TaxConfig = DEFAULT_TAX_CONFIG
): FinancialExportPayload {
  return {
    range,
    summary,
    transactions,
    taxConfig,
    generatedAt: new Date().toISOString(),
  }
}

export function createFinancialPayload(
  sources: FinancialDataSources,
  range: FinancialDateRange,
  filters: FinancialFilters = DEFAULT_FINANCIAL_FILTERS,
  taxConfig: TaxConfig = DEFAULT_TAX_CONFIG
): FinancialPayload {
  const previousRange = getPreviousRange(range)
  const ledger = buildFinancialLedger(sources, taxConfig)

  const rangeTransactions = filterTransactionsByRange(ledger, range)
  const previousRangeTransactions = filterTransactionsByRange(
    ledger,
    previousRange
  )

  const filteredTransactions = filterFinancialTransactions(
    rangeTransactions,
    filters
  )

  const summary = computeFinancialSummary(
    rangeTransactions,
    sources.cases,
    taxConfig
  )
  const previousSummary = computeFinancialSummary(
    previousRangeTransactions,
    sources.cases,
    taxConfig
  )
  /** Export summary matches filtered rows so the workbook stays self-consistent. */
  const exportSummary = computeFinancialSummary(
    filteredTransactions,
    sources.cases,
    taxConfig
  )

  const hasAnyData = ledger.length > 0

  return {
    range,
    previousRange,
    taxConfig,
    hasAnyData,
    rangeTransactionCount: rangeTransactions.length,
    summary,
    kpis: buildKpis(summary, previousSummary),
    transactions: filteredTransactions,
    timeline: computeTimeline(rangeTransactions, range),
    exportPayload: createFinancialExportPayload(
      range,
      exportSummary,
      filteredTransactions,
      taxConfig
    ),
  }
}
