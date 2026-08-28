'use client'

import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { combineDateAndTime, formatEventDate, toDateKey } from '../utils/datetime'

type EventsDatePickerProps = {
  id?: string
  value: string
  onChange: (dateKey: string) => void
  placeholder?: string
  disabled?: boolean
  'aria-label'?: string
}

function dateKeyToDate(dateKey: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return undefined
  return combineDateAndTime(dateKey, '00:00')
}

export function EventsDatePicker({
  id,
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  disabled = false,
  'aria-label': ariaLabel,
}: EventsDatePickerProps) {
  const selected = dateKeyToDate(value)

  if (disabled) {
    return (
      <Button
        id={id}
        type='button'
        variant='outline'
        disabled
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          'h-10 w-full cursor-not-allowed justify-start bg-muted text-start font-normal opacity-90'
        )}
      >
        {value ? (
          <span className='tabular-nums'>{formatEventDate(value)}</span>
        ) : (
          <span className='text-muted-foreground'>{placeholder}</span>
        )}
        <CalendarIcon className='ms-auto size-4 opacity-50' aria-hidden />
      </Button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type='button'
          variant='outline'
          data-empty={!selected}
          aria-label={ariaLabel ?? placeholder}
          className={cn(
            'h-10 w-full justify-start text-start font-normal',
            'data-[empty=true]:text-muted-foreground'
          )}
        >
          {selected ? (
            <span className='tabular-nums'>{formatEventDate(value)}</span>
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className='ms-auto size-4 opacity-50' aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-auto overflow-visible p-0'
        align='start'
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement | null
          if (target?.closest('[data-slot="select-content"]')) {
            event.preventDefault()
          }
        }}
      >
        <Calendar
          mode='single'
          captionLayout='dropdown'
          selected={selected}
          onSelect={(date) => {
            if (date) onChange(toDateKey(date))
          }}
          defaultMonth={selected}
          startMonth={new Date(1921, 0)}
          endMonth={new Date(new Date().getFullYear() + 10, 11)}
          disabled={(date: Date) => date < new Date('1921-01-01')}
        />
      </PopoverContent>
    </Popover>
  )
}
