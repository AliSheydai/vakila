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
import { formatStatDate } from '../utils/format'

type StatsDatePickerProps = {
  id?: string
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  placeholder?: string
  'aria-label'?: string
}

export function StatsDatePicker({
  id,
  selected,
  onSelect,
  placeholder = 'انتخاب تاریخ',
  'aria-label': ariaLabel,
}: StatsDatePickerProps) {
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
            <span className='tabular-nums'>{formatStatDate(selected)}</span>
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
          onSelect={onSelect}
          defaultMonth={selected}
          startMonth={new Date(1921, 0)}
          endMonth={new Date()}
          disabled={(date: Date) =>
            date > new Date() || date < new Date('1921-01-01')
          }
        />
      </PopoverContent>
    </Popover>
  )
}
