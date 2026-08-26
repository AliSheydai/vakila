import type { KpiMetric, StatisticsComparison, StatisticsPreset } from '../types'

const numberFormatter = new Intl.NumberFormat('fa-IR')
const moneyFormatter = new Intl.NumberFormat('fa-IR')
const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

export const STATISTICS_PRESET_LABELS: Record<StatisticsPreset, string> = {
  today: 'امروز',
  this_week: 'این هفته',
  this_month: 'این ماه',
  last_3_months: 'سه ماه اخیر',
  this_year: 'امسال',
  last_year: 'سال گذشته',
  custom: 'بازه دلخواه',
}

export const KPI_LABELS: Record<KpiMetric, string> = {
  new_clients: 'موکلین جدید',
  created_cases: 'پرونده‌های ایجادشده',
  closed_cases: 'پرونده‌های بسته‌شده',
  sessions: 'جلسات',
  revenue: 'درآمد',
  avg_revenue_per_session: 'میانگین درآمد هر جلسه',
}

export function formatStatNumber(value: number): string {
  return numberFormatter.format(Math.round(value))
}

export function formatStatMoney(value: number): string {
  return `${moneyFormatter.format(Math.round(value))} ریال`
}

export function formatStatDate(date: Date): string {
  try {
    return dateFormatter.format(date)
  } catch {
    return '—'
  }
}

export function formatStatRangeLabel(from: Date, to: Date): string {
  return `${formatStatDate(from)} تا ${formatStatDate(to)}`
}

export function formatComparisonHint(
  comparison: StatisticsComparison
): string {
  if (comparison.changePercent === null) {
    if (comparison.previous === 0 && comparison.current > 0) {
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

export function isMoneyMetric(metric: KpiMetric): boolean {
  return metric === 'revenue' || metric === 'avg_revenue_per_session'
}
