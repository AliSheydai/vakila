import type {
  Case,
  Client,
  ExpenseCategory,
  PaymentMethod,
  PaymentRecordStatus,
} from '@/features/cases/types'

export type FinancialPreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_3_months'
  | 'this_year'
  | 'last_year'
  | 'custom'

export type FinancialDateRange = {
  preset: FinancialPreset
  from: Date
  to: Date
}

export type FinancialTransactionKind = 'payment' | 'expense'
export type FinancialDirection = 'inflow' | 'outflow'

/**
 * View-model ledger row — not persisted separately.
 * Built from Case.payments / Case.expenses + client lookup.
 */
export type FinancialTransaction = {
  id: string
  kind: FinancialTransactionKind
  direction: FinancialDirection
  amount: number
  taxAmount: number
  netAmount: number
  date: string
  status?: PaymentRecordStatus
  method?: PaymentMethod
  category?: ExpenseCategory
  description?: string
  caseId: string
  caseTitle: string
  caseNumber: string
  clientId?: string | null
  clientName?: string | null
  /** Original paymentId or expenseId */
  sourceRef: string
}

export type FinancialKpiKey =
  | 'gross_revenue'
  | 'tax_total'
  | 'net_revenue'
  | 'expenses_total'
  | 'profit'
  | 'receivables'

export type FinancialComparison = {
  current: number
  previous: number
  changePercent: number | null
  direction: 'up' | 'down' | 'flat'
}

export type FinancialKpi = {
  key: FinancialKpiKey
  value: number
  /** Period comparison; omitted for snapshot KPIs (e.g. receivables) */
  comparison?: FinancialComparison
  /** When true, value is current snapshot — not filtered by date range */
  isSnapshot?: boolean
}

export type FinancialSummary = {
  grossRevenue: number
  taxTotal: number
  netRevenue: number
  expensesTotal: number
  profit: number
  /** Current outstanding across all cases (not range-scoped) */
  receivables: number
  successfulPaymentCount: number
  pendingPaymentCount: number
  failedPaymentCount: number
  expenseCount: number
  averageSuccessfulPayment: number
  expenseToRevenueRatio: number | null
  taxRate: number
}

export type FinancialFilters = {
  query: string
  kind: 'all' | FinancialTransactionKind
  paymentStatus: 'all' | PaymentRecordStatus
  method: 'all' | PaymentMethod
  category: 'all' | ExpenseCategory
  clientId: 'all' | string
  caseId: 'all' | string
}

export type FinancialTimePoint = {
  label: string
  from: string
  to: string
  inflow: number
  outflow: number
  net: number
}

export type TaxConfig = {
  /** Fraction of completed payment amount, e.g. 0.09 = 9% */
  rate: number
  label: string
}

export type FinancialDataSources = {
  cases: Case[]
  clients: Client[]
}

export type FinancialExportPayload = {
  range: FinancialDateRange
  summary: FinancialSummary
  transactions: FinancialTransaction[]
  taxConfig: TaxConfig
  generatedAt: string
}

export type FinancialPayload = {
  range: FinancialDateRange
  previousRange: FinancialDateRange
  taxConfig: TaxConfig
  /** Any payment/expense exists in the system (unfiltered) */
  hasAnyData: boolean
  /** After date range, before table filters */
  rangeTransactionCount: number
  summary: FinancialSummary
  kpis: FinancialKpi[]
  transactions: FinancialTransaction[]
  timeline: FinancialTimePoint[]
  exportPayload: FinancialExportPayload
}

export const DEFAULT_FINANCIAL_FILTERS: FinancialFilters = {
  query: '',
  kind: 'all',
  paymentStatus: 'all',
  method: 'all',
  category: 'all',
  clientId: 'all',
  caseId: 'all',
}
