'use client'

import { startTransition, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { FinancialChartsSection } from './components/financial-charts-section'
import { FinancialDateRange } from './components/financial-date-range'
import { FinancialEmptyState } from './components/financial-empty-state'
import { FinancialErrorState } from './components/financial-error-state'
import { FinancialFiltersBar } from './components/financial-filters'
import { FinancialHeader } from './components/financial-header'
import { FinancialKpiSection } from './components/financial-kpi-section'
import { FinancialLoadingState } from './components/financial-loading-state'
import { FinancialTransactionsTable } from './components/financial-transactions-table'
import { useFinancial } from './hooks/use-financial'
import { downloadFinancialExcel } from './services/export'
import type { FinancialFilters, FinancialPreset } from './types'
import { DEFAULT_FINANCIAL_FILTERS } from './types'
import { hasActiveFinancialFilters } from './utils/format'

function normalizeCustomRange(
  from: Date | undefined,
  to: Date | undefined
): { from: Date; to: Date } | undefined {
  if (!from || !to) return undefined
  if (from.getTime() <= to.getTime()) return { from, to }
  return { from: to, to: from }
}

export function FinancialPage() {
  const [preset, setPreset] = useState<FinancialPreset>('this_month')
  const [customFrom, setCustomFrom] = useState<Date | undefined>()
  const [customTo, setCustomTo] = useState<Date | undefined>()
  const [filters, setFilters] = useState<FinancialFilters>({
    ...DEFAULT_FINANCIAL_FILTERS,
  })
  const [exportLoading, setExportLoading] = useState(false)

  const customRange = useMemo(
    () => normalizeCustomRange(customFrom, customTo),
    [customFrom, customTo]
  )

  const effectivePreset =
    preset === 'custom' && !customRange ? 'this_month' : preset

  const { hydrated, range, financial, error, retry, cases, clients } =
    useFinancial({
      preset: effectivePreset,
      customRange: preset === 'custom' ? customRange : undefined,
      filters,
    })

  const handlePresetChange = (next: FinancialPreset) => {
    startTransition(() => {
      setPreset(next)
      if (next === 'custom') {
        setCustomFrom((prev) => prev ?? range.from)
        setCustomTo((prev) => prev ?? range.to)
      }
    })
  }

  const handleExport = () => {
    if (exportLoading) return
    setExportLoading(true)

    window.setTimeout(() => {
      try {
        const result = downloadFinancialExcel(financial.exportPayload)
        toast.success('گزارش اکسل آماده شد', {
          description:
            result.rowCount === 0
              ? `${result.filename} (بدون ردیف تراکنش)`
              : `${result.filename} · ${result.rowCount.toLocaleString('fa-IR')} ردیف`,
        })
      } catch (err) {
        console.error(err)
        toast.error('خروجی اکسل انجام نشد. دوباره تلاش کنید.')
      } finally {
        setExportLoading(false)
      }
    }, 0)
  }

  const waitingCustomRange = preset === 'custom' && !customRange
  const showContent =
    hydrated && !error && financial.hasAnyData && !waitingCustomRange
  const filtersActive = hasActiveFinancialFilters(filters)

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <FinancialHeader
          from={range.from}
          to={range.to}
          showRangeLabel={showContent}
          exportDisabled={!showContent}
          exportLoading={exportLoading}
          onExport={showContent ? handleExport : undefined}
        />

        {!hydrated ? (
          <FinancialLoadingState />
        ) : error ? (
          <FinancialErrorState message={error} onRetry={retry} />
        ) : !financial.hasAnyData ? (
          <FinancialEmptyState />
        ) : (
          <>
            <FinancialDateRange
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

            {waitingCustomRange ? (
              <div
                role='status'
                className='rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground'
              >
                برای محاسبه مالی، هر دو تاریخ «از» و «تا» را انتخاب کنید.
              </div>
            ) : (
              <div className='space-y-4 sm:space-y-6'>
                <FinancialKpiSection
                  kpis={financial.kpis}
                  taxLabel={financial.taxConfig.label}
                />

                <FinancialChartsSection financial={financial} />

                <div className='space-y-4 sm:space-y-5'>
                  <FinancialFiltersBar
                    filters={filters}
                    cases={cases}
                    clients={clients}
                    resultCount={financial.transactions.length}
                    onChange={(next) => {
                      startTransition(() => setFilters(next))
                    }}
                  />

                  <FinancialTransactionsTable
                    transactions={financial.transactions}
                    rangeTransactionCount={financial.rangeTransactionCount}
                    filtersActive={filtersActive}
                    onClearFilters={() => {
                      startTransition(() =>
                        setFilters({ ...DEFAULT_FINANCIAL_FILTERS })
                      )
                    }}
                  />
                </div>
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
export * from './hooks/use-financial'
