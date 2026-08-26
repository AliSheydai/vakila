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
import { formatFinancialDate } from '../utils/format'

type FinancialDatePickerProps = {
  id?: string
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  placeholder?: string
  'aria-label'?: string
}

export function FinancialDatePicker({
  id,
  selected,
  onSelect,
  placeholder = 'انتخاب تاریخ',
  'aria-label': ariaLabel,
}: FinancialDatePickerProps) {
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
            <span className='tabular-nums'>{formatFinancialDate(selected)}</span>
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className='ms-auto size-4 opacity-50' aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          captionLayout='dropdown'
          selected={selected}
          onSelect={onSelect}
          disabled={(date: Date) =>
            date > new Date() || date < new Date('1900-01-01')
          }
        />
      </PopoverContent>
    </Popover>
  )
}
