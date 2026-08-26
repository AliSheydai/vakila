'use client'

import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KpiValue } from '../types'
import {
  KPI_LABELS,
  formatComparisonHint,
  formatStatMoney,
  formatStatNumber,
  isMoneyMetric,
} from '../utils/format'

type StatsKpiSectionProps = {
  kpis: KpiValue[]
}

function ComparisonIcon({ direction }: { direction: KpiValue['comparison']['direction'] }) {
  if (direction === 'up') {
    return <ArrowUpRight className='size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400' />
  }
  if (direction === 'down') {
    return <ArrowDownRight className='size-3.5 shrink-0 text-rose-600 dark:text-rose-400' />
  }
  return <ArrowRight className='size-3.5 shrink-0 text-muted-foreground' />
}

export function StatsKpiSection({ kpis }: StatsKpiSectionProps) {
  return (
    <section aria-label='شاخص‌های کلیدی' className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
      {kpis.map((kpi) => {
        const valueLabel = isMoneyMetric(kpi.metric)
          ? formatStatMoney(kpi.value)
          : formatStatNumber(kpi.value)

        return (
          <article
            key={kpi.metric}
            className='rounded-xl border bg-background/60 px-4 py-4'
          >
            <p className='text-xs text-muted-foreground sm:text-sm'>
              {KPI_LABELS[kpi.metric]}
            </p>
            <p className='mt-2 text-2xl font-semibold tracking-tight tabular-nums'>
              {valueLabel}
            </p>
            <div
              className={cn(
                'mt-2 flex items-start gap-1.5 text-xs leading-5',
                kpi.comparison.direction === 'up' &&
                  'text-emerald-700 dark:text-emerald-400',
                kpi.comparison.direction === 'down' &&
                  'text-rose-700 dark:text-rose-400',
                kpi.comparison.direction === 'flat' && 'text-muted-foreground'
              )}
            >
              <ComparisonIcon direction={kpi.comparison.direction} />
              <span>{formatComparisonHint(kpi.comparison)}</span>
            </div>
          </article>
        )
      })}
    </section>
  )
}
