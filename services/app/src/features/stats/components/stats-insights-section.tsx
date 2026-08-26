'use client'

import {
  AlertTriangle,
  Lightbulb,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatisticsInsight, StatisticsInsightTone } from '../types'

type StatsInsightsSectionProps = {
  insights: StatisticsInsight[]
}

function toneIcon(tone: StatisticsInsightTone) {
  if (tone === 'positive') return TrendingUp
  if (tone === 'negative') return TrendingDown
  if (tone === 'warning') return AlertTriangle
  return Lightbulb
}

function toneClass(tone: StatisticsInsightTone): string {
  if (tone === 'positive') {
    return 'border-emerald-200/80 bg-emerald-50/50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100'
  }
  if (tone === 'negative') {
    return 'border-rose-200/80 bg-rose-50/50 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-100'
  }
  if (tone === 'warning') {
    return 'border-amber-200/80 bg-amber-50/50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100'
  }
  return 'border-border bg-background/60 text-foreground'
}

export function StatsInsightsSection({ insights }: StatsInsightsSectionProps) {
  if (insights.length === 0) return null

  return (
    <section aria-label='بینش‌های عملکرد' className='space-y-3'>
      <div className='space-y-1'>
        <h3 className='text-sm font-semibold tracking-tight sm:text-base'>
          بینش‌های سریع
        </h3>
        <p className='text-xs text-muted-foreground sm:text-sm'>
          نکات قابل فهم بر اساس داده واقعی همین بازه و مقایسه با دوره قبل.
        </p>
      </div>

      <ul className='grid gap-2 sm:grid-cols-2'>
        {insights.map((insight) => {
          const Icon = toneIcon(insight.tone)
          return (
            <li
              key={insight.id}
              className={cn(
                'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6',
                toneClass(insight.tone)
              )}
            >
              <Icon className='mt-0.5 size-4 shrink-0 opacity-80' />
              <p>{insight.text}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
