'use client'

import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type DatePickerProps = {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  placeholder?: string
}

function formatPersianDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch {
    return '—'
  }
}

export function DatePicker({
  selected,
  onSelect,
  placeholder = 'انتخاب تاریخ',
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          data-empty={!selected}
          className='w-60 justify-start text-start font-normal data-[empty=true]:text-muted-foreground'
        >
          {selected ? (
            <span className='tabular-nums'>{formatPersianDate(selected)}</span>
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className='ms-auto h-4 w-4 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-auto overflow-visible p-0'
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
