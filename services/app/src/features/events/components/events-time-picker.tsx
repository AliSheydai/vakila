'use client'

import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  formatEventTimePersian,
  persianPartsToTime,
  timeToPersianParts,
  type PersianTimePeriod,
} from '../utils/datetime'

type EventsTimePickerProps = {
  id?: string
  value: string
  onChange: (time: string) => void
  placeholder?: string
  'aria-label'?: string
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1)
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index)

const PERIOD_OPTIONS: Array<{ value: PersianTimePeriod; label: string }> = [
  { value: 'am', label: 'قبل از ظهر' },
  { value: 'pm', label: 'بعد از ظهر' },
]

function formatHourLabel(hour: number): string {
  return hour.toLocaleString('fa-IR')
}

function formatMinuteLabel(minute: number): string {
  return minute.toLocaleString('fa-IR', { minimumIntegerDigits: 2 })
}

export function EventsTimePicker({
  id,
  value,
  onChange,
  placeholder = 'انتخاب ساعت',
  'aria-label': ariaLabel,
}: EventsTimePickerProps) {
  const parts = useMemo(() => timeToPersianParts(value), [value])
  const hasValue = parts !== null

  function updateParts(patch: Partial<NonNullable<typeof parts>>) {
    if (!parts) return
    onChange(
      persianPartsToTime({
        ...parts,
        ...patch,
      })
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type='button'
          variant='outline'
          data-empty={!hasValue}
          aria-label={ariaLabel ?? placeholder}
          className={cn(
            'h-10 w-full justify-start text-start font-normal',
            'data-[empty=true]:text-muted-foreground'
          )}
        >
          {hasValue ? (
            <span className='tabular-nums'>{formatEventTimePersian(value)}</span>
          ) : (
            <span>{placeholder}</span>
          )}
          <Clock className='ms-auto size-4 opacity-50' aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-auto overflow-visible p-3'
        align='start'
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement | null
          if (target?.closest('[data-slot="select-content"]')) {
            event.preventDefault()
          }
        }}
      >
        {parts ? (
          <div className='grid grid-cols-3 gap-2'>
            <div className='space-y-1.5'>
              <p className='text-xs text-muted-foreground'>ساعت</p>
              <Select
                value={String(parts.hour12)}
                onValueChange={(next) =>
                  updateParts({ hour12: Number(next) })
                }
              >
                <SelectTrigger
                  className='w-full min-w-18'
                  aria-label='ساعت'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='max-h-60'>
                  {HOUR_OPTIONS.map((hour) => (
                    <SelectItem key={hour} value={String(hour)}>
                      {formatHourLabel(hour)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <p className='text-xs text-muted-foreground'>دقیقه</p>
              <Select
                value={String(parts.minute)}
                onValueChange={(next) =>
                  updateParts({ minute: Number(next) })
                }
              >
                <SelectTrigger
                  className='w-full min-w-18'
                  aria-label='دقیقه'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='max-h-60'>
                  {MINUTE_OPTIONS.map((minute) => (
                    <SelectItem key={minute} value={String(minute)}>
                      {formatMinuteLabel(minute)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <p className='text-xs text-muted-foreground'>بازه</p>
              <Select
                value={parts.period}
                onValueChange={(next) =>
                  updateParts({ period: next as PersianTimePeriod })
                }
              >
                <SelectTrigger
                  className='w-full min-w-28'
                  aria-label='قبل یا بعد از ظهر'
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
