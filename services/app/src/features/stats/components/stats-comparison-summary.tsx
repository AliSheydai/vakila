'use client'

import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KpiValue, StatisticsDateRange } from '../types'
import {
  KPI_LABELS,
  formatComparisonHint,
  formatStatMoney,
  formatStatNumber,
  formatStatRangeLabel,
  isMoneyMetric,
} from '../utils/format'

type StatsComparisonSummaryProps = {
  previousRange: StatisticsDateRange
  kpis: KpiValue[]
}

function TrendIcon({
  direction,
}: {
  direction: KpiValue['comparison']['direction']
}) {
  if (direction === 'up') {
    return <ArrowUpRight className='size-3.5 text-emerald-600 dark:text-emerald-400' />
  }
  if (direction === 'down') {
    return <ArrowDownRight className='size-3.5 text-rose-600 dark:text-rose-400' />
  }
  return <ArrowRight className='size-3.5 text-muted-foreground' />
}

export function StatsComparisonSummary({
  previousRange,
  kpis,
}: StatsComparisonSummaryProps) {
  const highlights = kpis.filter(
    (kpi) =>
      kpi.comparison.previous > 0 ||
      kpi.comparison.current > 0 ||
      kpi.comparison.changePercent !== null
  )

  if (highlights.length === 0) return null

  return (
    <section
      aria-label='مقایسه با دوره قبل'
      className='rounded-xl border bg-background/60 p-4 sm:p-5'
    >
      <div className='mb-3 space-y-1'>
        <h3 className='text-sm font-semibold tracking-tight sm:text-base'>
          مقایسه با دوره قبل
        </h3>
        <p className='text-xs text-muted-foreground sm:text-sm'>
          دوره قبل: {formatStatRangeLabel(previousRange.from, previousRange.to)}
        </p>
      </div>

      <ul className='grid gap-2 sm:grid-cols-2 xl:grid-cols-3'>
        {highlights.map((kpi) => {
          const valueLabel = isMoneyMetric(kpi.metric)
            ? formatStatMoney(kpi.value)
            : formatStatNumber(kpi.value)
          const previousLabel = isMoneyMetric(kpi.metric)
            ? formatStatMoney(kpi.comparison.previous)
            : formatStatNumber(kpi.comparison.previous)

          return (
            <li
              key={kpi.metric}
              className='flex items-start gap-2 rounded-lg border border-border/70 px-3 py-2.5'
            >
              <TrendIcon direction={kpi.comparison.direction} />
              <div className='min-w-0 space-y-0.5'>
                <p className='text-xs text-muted-foreground'>
                  {KPI_LABELS[kpi.metric]}
                </p>
                <p className='text-sm font-medium tabular-nums'>
                  {valueLabel}
                  <span className='mx-1 text-muted-foreground'>/</span>
                  <span className='text-muted-foreground'>{previousLabel}</span>
                </p>
                <p
                  className={cn(
                    'text-[11px] leading-4',
                    kpi.comparison.direction === 'up' &&
                      'text-emerald-700 dark:text-emerald-400',
                    kpi.comparison.direction === 'down' &&
                      'text-rose-700 dark:text-rose-400',
                    kpi.comparison.direction === 'flat' && 'text-muted-foreground'
                  )}
                >
                  {formatComparisonHint(kpi.comparison)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
