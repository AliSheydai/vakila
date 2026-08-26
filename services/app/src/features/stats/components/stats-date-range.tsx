'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StatisticsPreset } from '../types'
import {
  STATISTICS_PRESET_LABELS,
  formatStatRangeLabel,
} from '../utils/format'
import { StatsDatePicker } from './stats-date-picker'

const PRESETS: StatisticsPreset[] = [
  'today',
  'this_week',
  'this_month',
  'last_3_months',
  'this_year',
  'last_year',
  'custom',
]

type StatsDateRangeProps = {
  preset: StatisticsPreset
  from: Date
  to: Date
  customFrom: Date | undefined
  customTo: Date | undefined
  onPresetChange: (preset: StatisticsPreset) => void
  onCustomFromChange: (date: Date | undefined) => void
  onCustomToChange: (date: Date | undefined) => void
}

export function StatsDateRange({
  preset,
  from,
  to,
  customFrom,
  customTo,
  onPresetChange,
  onCustomFromChange,
  onCustomToChange,
}: StatsDateRangeProps) {
  return (
    <section
      aria-label='انتخاب بازه زمانی'
      className='flex w-full flex-col gap-3 rounded-xl border bg-background/60 p-3 sm:p-4'
    >
      <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between'>
        <div className='min-w-0 space-y-1'>
          <p className='text-sm font-medium'>بازه زمانی</p>
          <p className='text-xs text-muted-foreground sm:text-sm' aria-live='polite'>
            {formatStatRangeLabel(from, to)}
          </p>
        </div>

        <div className='w-full sm:max-w-xs sm:flex-1'>
          <label
            className='mb-1.5 block text-xs text-muted-foreground'
            htmlFor='stats-preset'
          >
            انتخاب بازه
          </label>
          <Select
            value={preset}
            onValueChange={(value) => onPresetChange(value as StatisticsPreset)}
          >
            <SelectTrigger
              id='stats-preset'
              className='w-full'
              aria-label='انتخاب بازه زمانی آمار'
            >
              <SelectValue placeholder='انتخاب بازه' />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((item) => (
                <SelectItem key={item} value={item}>
                  {STATISTICS_PRESET_LABELS[item]}
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
              htmlFor='stats-from-date'
            >
              از تاریخ
            </label>
            <StatsDatePicker
              id='stats-from-date'
              selected={customFrom}
              onSelect={onCustomFromChange}
              placeholder='از تاریخ'
              aria-label='از تاریخ'
            />
          </div>
          <div className='min-w-0'>
            <label
              className='mb-1.5 block text-xs text-muted-foreground'
              htmlFor='stats-to-date'
            >
              تا تاریخ
            </label>
            <StatsDatePicker
              id='stats-to-date'
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
