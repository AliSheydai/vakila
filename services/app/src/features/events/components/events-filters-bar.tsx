'use client'

import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EVENT_TEMPORAL_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  EVENT_TYPES,
  type EventRelationFilter,
  type EventTemporalFilter,
  type EventTypeFilter,
} from '../types'
import { useEventsUi } from './events-provider'

const RELATION_OPTIONS: Array<{
  value: EventRelationFilter
  label: string
}> = [
  { value: 'all', label: 'همه' },
  { value: 'with_case', label: 'دارای پرونده' },
  { value: 'with_client', label: 'دارای موکل' },
]

export function EventsFiltersBar() {
  const { filters, setFilter, resetFilters, hasActiveFilters, setSurface } =
    useEventsUi()

  return (
    <div className='flex flex-col gap-2 lg:flex-row lg:items-center'>
      <div className='relative min-w-0 flex-1'>
        <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={filters.query}
          onChange={(event) => {
            const value = event.target.value
            setFilter('query', value)
            // جستجو در لیست واضح‌تر است
            if (value.trim()) {
              setSurface('list')
            }
          }}
          placeholder='جستجو عنوان، موکل، پرونده…'
          className='ps-9'
          aria-label='جستجوی رویدادها'
        />
      </div>

      <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
        <Select
          value={filters.type}
          onValueChange={(value) => setFilter('type', value as EventTypeFilter)}
        >
          <SelectTrigger className='w-full lg:w-44' aria-label='نوع رویداد'>
            <SelectValue placeholder='نوع رویداد' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>همه انواع</SelectItem>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {EVENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.temporal}
          onValueChange={(value) =>
            setFilter('temporal', value as EventTemporalFilter)
          }
        >
          <SelectTrigger className='w-full lg:w-40' aria-label='وضعیت زمانی'>
            <SelectValue placeholder='زمان' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>همه زمان‌ها</SelectItem>
            <SelectItem value='today'>
              {EVENT_TEMPORAL_STATUS_LABELS.today}
            </SelectItem>
            <SelectItem value='upcoming'>
              {EVENT_TEMPORAL_STATUS_LABELS.upcoming}
            </SelectItem>
            <SelectItem value='past'>
              {EVENT_TEMPORAL_STATUS_LABELS.past}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.relation}
          onValueChange={(value) =>
            setFilter('relation', value as EventRelationFilter)
          }
        >
          <SelectTrigger className='w-full lg:w-40' aria-label='ارتباط'>
            <SelectValue placeholder='ارتباط' />
          </SelectTrigger>
          <SelectContent>
            {RELATION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='shrink-0 self-start lg:self-center'
          onClick={resetFilters}
        >
          <X className='size-4' />
          پاک کردن
        </Button>
      )}
    </div>
  )
}
