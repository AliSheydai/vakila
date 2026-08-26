'use client'

import { startTransition, useMemo, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useCasesStore } from '@/features/cases/stores/cases-store'
import { useEventsStore } from '@/features/events/stores/events-store'
import { StatsChartsSection } from './components/stats-charts-section'
import { StatsComparisonSummary } from './components/stats-comparison-summary'
import { StatsDateRange } from './components/stats-date-range'
import { StatsDetailsSection } from './components/stats-details-section'
import { StatsEmptyState } from './components/stats-empty-state'
import { StatsErrorState } from './components/stats-error-state'
import { StatsInsightsSection } from './components/stats-insights-section'
import { StatsKpiSection } from './components/stats-kpi-section'
import { StatsLoadingState } from './components/stats-loading-state'
import { useStatistics } from './hooks/use-statistics'
import type { StatisticsPreset } from './types'
import { formatStatRangeLabel } from './utils/format'

function normalizeCustomRange(
  from: Date | undefined,
  to: Date | undefined
): { from: Date; to: Date } | undefined {
  if (!from || !to) return undefined
  if (from.getTime() <= to.getTime()) return { from, to }
  return { from: to, to: from }
}

export function StatsPage() {
  const [preset, setPreset] = useState<StatisticsPreset>('this_month')
  const [customFrom, setCustomFrom] = useState<Date | undefined>()
  const [customTo, setCustomTo] = useState<Date | undefined>()

  const customRange = useMemo(
    () => normalizeCustomRange(customFrom, customTo),
    [customFrom, customTo]
  )

  const effectivePreset =
    preset === 'custom' && !customRange ? 'this_month' : preset

  const { hydrated, range, statistics, retry } = useStatistics({
    preset: effectivePreset,
    customRange: preset === 'custom' ? customRange : undefined,
  })

  const casesError = useCasesStore((state) => state.error)
  const eventsError = useEventsStore((state) => state.error)
  const cases = useCasesStore((state) => state.cases)
  const error = casesError ?? eventsError

  const handlePresetChange = (next: StatisticsPreset) => {
    startTransition(() => {
      setPreset(next)
      if (next === 'custom') {
        setCustomFrom((prev) => prev ?? range.from)
        setCustomTo((prev) => prev ?? range.to)
      }
    })
  }

  const showContent =
    hydrated && !error && statistics.hasAnyData && !(preset === 'custom' && !customRange)

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between'>
          <div className='min-w-0'>
            <h2 className='text-xl font-bold tracking-tight sm:text-2xl'>
              آمارها
            </h2>
            <p className='mt-1 text-sm text-muted-foreground sm:text-base'>
              نمای تحلیلی عملکرد کاری شما در بازه زمانی انتخاب‌شده.
            </p>
          </div>
          {showContent ? (
            <p className='text-xs text-muted-foreground sm:text-sm' aria-live='polite'>
              {formatStatRangeLabel(range.from, range.to)}
            </p>
          ) : null}
        </div>

        {!hydrated ? (
          <StatsLoadingState />
        ) : error ? (
          <StatsErrorState message={error} onRetry={retry} />
        ) : !statistics.hasAnyData ? (
          <StatsEmptyState />
        ) : (
          <>
            <StatsDateRange
              preset={preset}
              from={range.from}
              to={range.to}
              customFrom={customFrom}
              customTo={customTo}
              onPresetChange={handlePresetChange}
              onCustomFromChange={(date) => {
                startTransition(() => setCustomFrom(date))
              }}
              onCustomToChange={(date) => {
                startTransition(() => setCustomTo(date))
              }}
            />

            {preset === 'custom' && !customRange ? (
              <div
                role='status'
                className='rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground'
              >
                برای محاسبه آمار، هر دو تاریخ «از» و «تا» را انتخاب کنید.
              </div>
            ) : (
              <div className='space-y-4 sm:space-y-6' aria-live='polite'>
                <StatsKpiSection kpis={statistics.kpis} />
                <StatsComparisonSummary
                  previousRange={statistics.previousRange}
                  kpis={statistics.kpis}
                />
                <StatsInsightsSection insights={statistics.insights} />
                <StatsChartsSection statistics={statistics} />
                <StatsDetailsSection
                  timeline={statistics.timeline}
                  range={statistics.range}
                  cases={cases}
                />
              </div>
            )}
          </>
        )}
      </Main>
    </>
  )
}

export * from './types'
export * from './services'
export * from './hooks/use-statistics'
