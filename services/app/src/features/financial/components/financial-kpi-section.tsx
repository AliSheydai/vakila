'use client'

import { ArrowDownRight, Minus, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FinancialKpi, FinancialKpiKey } from '../types'
import {
  FINANCIAL_KPI_LABELS,
  formatFinancialComparisonHint,
  formatFinancialMoney,
} from '../utils/format'

type FinancialKpiSectionProps = {
  kpis: FinancialKpi[]
  taxLabel: string
}

/** For tax/expenses, an increase is usually undesirable. */
const COST_LIKE_KEYS: FinancialKpiKey[] = ['tax_total', 'expenses_total']

function isFavorableUp(key: FinancialKpiKey): boolean {
  return !COST_LIKE_KEYS.includes(key)
}

function ComparisonIcon({
  direction,
  favorableUp,
}: {
  direction: NonNullable<FinancialKpi['comparison']>['direction']
  favorableUp: boolean
}) {
  if (direction === 'up') {
    return (
      <ArrowUpRight
        className={cn(
          'size-3.5 shrink-0',
          favorableUp
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400'
        )}
        aria-hidden
      />
    )
  }
  if (direction === 'down') {
    return (
      <ArrowDownRight
        className={cn(
          'size-3.5 shrink-0',
          favorableUp
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-emerald-600 dark:text-emerald-400'
        )}
        aria-hidden
      />
    )
  }
  return (
    <Minus className='size-3.5 shrink-0 text-muted-foreground' aria-hidden />
  )
}

function comparisonToneClass(
  key: FinancialKpiKey,
  direction: NonNullable<FinancialKpi['comparison']>['direction']
): string {
  if (direction === 'flat') return 'text-muted-foreground'
  const upIsGood = isFavorableUp(key)
  const isPositiveTone =
    (direction === 'up' && upIsGood) || (direction === 'down' && !upIsGood)
  return isPositiveTone
    ? 'text-emerald-700 dark:text-emerald-400'
    : 'text-rose-700 dark:text-rose-400'
}

export function FinancialKpiSection({
  kpis,
  taxLabel,
}: FinancialKpiSectionProps) {
  return (
    <section aria-label='شاخص‌های مالی' className='space-y-3'>
      <p className='text-xs leading-5 text-muted-foreground sm:text-sm'>
        {taxLabel}
      </p>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {kpis.map((kpi) => {
          const valueLabel = formatFinancialMoney(kpi.value)
          const isNegativeProfit = kpi.key === 'profit' && kpi.value < 0
          const comparison = kpi.comparison
          const label = FINANCIAL_KPI_LABELS[kpi.key]

          return (
            <article
              key={kpi.key}
              aria-label={`${label}: ${valueLabel}`}
              className={cn(
                'rounded-xl border bg-background/60 px-4 py-4',
                isNegativeProfit && 'border-rose-200/80 dark:border-rose-900/50'
              )}
            >
              <p className='text-xs text-muted-foreground sm:text-sm'>
                {label}
                {kpi.isSnapshot ? (
                  <span className='ms-1 text-[11px] text-muted-foreground/80'>
                    (وضعیت فعلی)
                  </span>
                ) : null}
              </p>
              <p
                className={cn(
                  'mt-2 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl',
                  isNegativeProfit && 'text-rose-700 dark:text-rose-400'
                )}
              >
                {valueLabel}
              </p>
              {comparison ? (
                <div
                  className={cn(
                    'mt-2 flex items-start gap-1.5 text-xs leading-5',
                    comparisonToneClass(kpi.key, comparison.direction)
                  )}
                >
                  <ComparisonIcon
                    direction={comparison.direction}
                    favorableUp={isFavorableUp(kpi.key)}
                  />
                  <span>{formatFinancialComparisonHint(comparison)}</span>
                </div>
              ) : kpi.isSnapshot ? (
                <p className='mt-2 text-xs leading-5 text-muted-foreground'>
                  بر اساس حق‌الزحمه و پرداخت‌های موفق تمام پرونده‌ها
                </p>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
