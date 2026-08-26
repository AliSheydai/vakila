import type { PaymentRecordStatus } from '@/features/cases/types'
import type {
  FinancialComparison,
  FinancialFilters,
  FinancialKpiKey,
  FinancialPreset,
  FinancialTransactionKind,
} from '../types'
import { DEFAULT_FINANCIAL_FILTERS } from '../types'

const numberFormatter = new Intl.NumberFormat('fa-IR')
const moneyFormatter = new Intl.NumberFormat('fa-IR')
const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

export const FINANCIAL_PRESET_LABELS: Record<FinancialPreset, string> = {
  today: 'امروز',
  this_week: 'این هفته',
  this_month: 'این ماه',
  last_3_months: 'سه ماه اخیر',
  this_year: 'امسال',
  last_year: 'سال گذشته',
  custom: 'بازه دلخواه',
}

export const FINANCIAL_KPI_LABELS: Record<FinancialKpiKey, string> = {
  gross_revenue: 'درآمد ناخالص',
  tax_total: 'مالیات محاسبه‌شده',
  net_revenue: 'درآمد خالص',
  expenses_total: 'هزینه‌ها',
  profit: 'سود',
  receivables: 'طلب فعلی موکلین',
}

export const FINANCIAL_KIND_LABELS: Record<
  FinancialTransactionKind | 'all',
  string
> = {
  all: 'همه انواع',
  payment: 'دریافت',
  expense: 'هزینه',
}

export const FINANCIAL_PAYMENT_STATUS_LABELS: Record<
  PaymentRecordStatus | 'all',
  string
> = {
  all: 'همه وضعیت‌ها',
  completed: 'موفق',
  pending: 'در انتظار',
  failed: 'ناموفق',
}

export function hasActiveFinancialFilters(filters: FinancialFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.kind !== DEFAULT_FINANCIAL_FILTERS.kind ||
    filters.paymentStatus !== DEFAULT_FINANCIAL_FILTERS.paymentStatus ||
    filters.method !== DEFAULT_FINANCIAL_FILTERS.method ||
    filters.category !== DEFAULT_FINANCIAL_FILTERS.category ||
    filters.clientId !== DEFAULT_FINANCIAL_FILTERS.clientId ||
    filters.caseId !== DEFAULT_FINANCIAL_FILTERS.caseId
  )
}

export function formatFinancialNumber(value: number): string {
  return numberFormatter.format(Math.round(value))
}

export function formatFinancialMoney(value: number): string {
  return `${moneyFormatter.format(Math.round(value))} ریال`
}

export function formatFinancialDate(date: Date | string): string {
  try {
    const value = typeof date === 'string' ? new Date(date) : date
    return dateFormatter.format(value)
  } catch {
    return '—'
  }
}

export function formatFinancialRangeLabel(from: Date, to: Date): string {
  return `${formatFinancialDate(from)} تا ${formatFinancialDate(to)}`
}

export function formatFinancialComparisonHint(
  comparison: FinancialComparison
): string {
  if (comparison.changePercent === null) {
    if (comparison.previous === 0 && comparison.current !== 0) {
      return 'نسبت به دوره قبل (بدون مبنای مقایسه)'
    }
    return 'بدون تغییر نسبت به دوره قبل'
  }

  const abs = Math.abs(comparison.changePercent)
  const formatted = numberFormatter.format(Number(abs.toFixed(1)))
  if (comparison.direction === 'up') return `↑ ${formatted}٪ نسبت به دوره قبل`
  if (comparison.direction === 'down') return `↓ ${formatted}٪ نسبت به دوره قبل`
  return `بدون تغییر نسبت به دوره قبل`
}

export function formatTaxRatePercent(rate: number): string {
  return `${numberFormatter.format(Math.round(rate * 100))}٪`
}
