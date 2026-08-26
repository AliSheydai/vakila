'use client'

import Link from 'next/link'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KpiValue } from '../types'
import {
  KPI_DRILLDOWN_HREF,
  KPI_LABELS,
  formatComparisonHint,
  formatStatMoney,
  formatStatNumber,
  isMoneyMetric,
} from '../utils/format'

type StatsKpiSectionProps = {
  kpis: KpiValue[]
}

function ComparisonIcon({
  direction,
}: {
  direction: KpiValue['comparison']['direction']
}) {
  if (direction === 'up') {
    return (
      <ArrowUpRight
        className='size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400'
        aria-hidden
      />
    )
  }
  if (direction === 'down') {
    return (
      <ArrowDownRight
        className='size-3.5 shrink-0 text-rose-600 dark:text-rose-400'
        aria-hidden
      />
    )
  }
  return (
    <ArrowRight className='size-3.5 shrink-0 text-muted-foreground' aria-hidden />
  )
}

export function StatsKpiSection({ kpis }: StatsKpiSectionProps) {
  return (
    <section aria-label='شاخص‌های کلیدی' className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
      {kpis.map((kpi) => {
        const valueLabel = isMoneyMetric(kpi.metric)
          ? formatStatMoney(kpi.value)
          : formatStatNumber(kpi.value)
        const href = KPI_DRILLDOWN_HREF[kpi.metric]
        const body = (
          <>
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
            {href ? (
              <p className='mt-2 text-[11px] text-muted-foreground'>
                مشاهده جزئیات
              </p>
            ) : null}
          </>
        )

        if (href) {
          return (
            <Link
              key={kpi.metric}
              href={href}
              className='rounded-xl border bg-background/60 px-4 py-4 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring'
              aria-label={`${KPI_LABELS[kpi.metric]}: ${valueLabel}. مشاهده فهرست مرتبط`}
            >
              {body}
            </Link>
          )
        }

        return (
          <article
            key={kpi.metric}
            className='rounded-xl border bg-background/60 px-4 py-4'
          >
            {body}
          </article>
        )
      })}
    </section>
  )
}
