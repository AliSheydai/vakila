'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FinancialPreset } from '../types'
import {
  FINANCIAL_PRESET_LABELS,
  formatFinancialRangeLabel,
} from '../utils/format'
import { FinancialDatePicker } from './financial-date-picker'

const PRESETS: FinancialPreset[] = [
  'today',
  'this_week',
  'this_month',
  'last_3_months',
  'this_year',
  'last_year',
  'custom',
]

type FinancialDateRangeProps = {
  preset: FinancialPreset
  from: Date
  to: Date
  customFrom: Date | undefined
  customTo: Date | undefined
  onPresetChange: (preset: FinancialPreset) => void
  onCustomFromChange: (date: Date | undefined) => void
  onCustomToChange: (date: Date | undefined) => void
}

export function FinancialDateRange({
  preset,
  from,
  to,
  customFrom,
  customTo,
  onPresetChange,
  onCustomFromChange,
  onCustomToChange,
}: FinancialDateRangeProps) {
  return (
    <section
      aria-label='انتخاب بازه زمانی مالی'
      className='flex w-full flex-col gap-3 rounded-xl border bg-background/60 p-3 sm:p-4'
    >
      <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between'>
        <div className='min-w-0 space-y-1'>
          <p className='text-sm font-medium'>بازه زمانی</p>
          <p
            className='text-xs text-muted-foreground sm:text-sm'
            aria-live='polite'
          >
            {formatFinancialRangeLabel(from, to)}
          </p>
        </div>

        <div className='w-full sm:max-w-xs sm:flex-1'>
          <label
            className='mb-1.5 block text-xs text-muted-foreground'
            htmlFor='financial-preset'
          >
            انتخاب بازه
          </label>
          <Select
            value={preset}
            onValueChange={(value) =>
              onPresetChange(value as FinancialPreset)
            }
          >
            <SelectTrigger
              id='financial-preset'
              className='w-full'
              aria-label='انتخاب بازه زمانی مالی'
            >
              <SelectValue placeholder='انتخاب بازه' />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((item) => (
                <SelectItem key={item} value={item}>
                  {FINANCIAL_PRESET_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {preset === 'custom' ? (
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='min-w-0'>
            <label
              className='mb-1.5 block text-xs text-muted-foreground'
              htmlFor='financial-from-date'
            >
              از تاریخ
            </label>
            <FinancialDatePicker
              id='financial-from-date'
              selected={customFrom}
              onSelect={onCustomFromChange}
              placeholder='از تاریخ'
              aria-label='از تاریخ'
            />
          </div>
          <div className='min-w-0'>
            <label
              className='mb-1.5 block text-xs text-muted-foreground'
              htmlFor='financial-to-date'
            >
              تا تاریخ
            </label>
            <FinancialDatePicker
              id='financial-to-date'
              selected={customTo}
              onSelect={onCustomToChange}
              placeholder='تا تاریخ'
              aria-label='تا تاریخ'
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
