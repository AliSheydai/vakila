'use client'

import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFinancialRangeLabel } from '../utils/format'

type FinancialHeaderProps = {
  from: Date
  to: Date
  showRangeLabel?: boolean
  onExport?: () => void
  exportDisabled?: boolean
  exportLoading?: boolean
}

export function FinancialHeader({
  from,
  to,
  showRangeLabel = false,
  onExport,
  exportDisabled = false,
  exportLoading = false,
}: FinancialHeaderProps) {
  const disabled = exportDisabled || !onExport || exportLoading

  return (
    <div
      className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between'
      aria-labelledby='financial-page-title'
    >
      <div className='min-w-0'>
        <h2
          id='financial-page-title'
          className='font-display text-xl font-bold tracking-tight sm:text-2xl'
        >
          مالی
        </h2>
        <p className='mt-1 text-sm text-muted-foreground sm:text-base'>
          دفتر دریافت‌ها، هزینه‌ها، مالیات محاسبه‌شده و سود پرونده‌ها در یک نگاه.
        </p>
      </div>

      <div className='flex flex-col items-stretch gap-2 sm:items-end'>
        {showRangeLabel ? (
          <p
            className='text-xs text-muted-foreground sm:text-sm'
            aria-live='polite'
          >
            {formatFinancialRangeLabel(from, to)}
          </p>
        ) : null}
        <Button
          type='button'
          variant='outline'
          className='w-full sm:w-auto'
          disabled={disabled}
          onClick={onExport}
          aria-label='خروجی اکسل گزارش مالی'
          aria-busy={exportLoading}
          title={
            exportDisabled
              ? 'خروجی اکسل در حال حاضر در دسترس نیست'
              : 'دانلود گزارش اکسل'
          }
        >
          {exportLoading ? (
            <Loader2 className='size-4 animate-spin' aria-hidden />
          ) : (
            <FileSpreadsheet className='size-4' aria-hidden />
          )}
          {exportLoading ? 'در حال آماده‌سازی...' : 'خروجی Excel'}
        </Button>
      </div>
    </div>
  )
}
