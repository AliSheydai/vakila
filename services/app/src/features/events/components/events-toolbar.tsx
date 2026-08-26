'use client'

import { CalendarDays, ChevronLeft, ChevronRight, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { EventsCalendarMode, EventsSurface } from '../types/ui'
import {
  addDays,
  addMonths,
  formatEventDate,
  formatMonthTitle,
  formatWeekRangeLabel,
  startOfWeekSaturday,
  toDateKey,
} from '../utils/datetime'
import { useEventsUi } from './events-provider'

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getNavLabel(
  surface: EventsSurface,
  calendarMode: EventsCalendarMode,
  anchorDate: Date,
  selectedDate: string
): string {
  if (surface === 'list') return formatMonthTitle(anchorDate)
  if (calendarMode === 'month') return formatMonthTitle(anchorDate)
  if (calendarMode === 'week') return formatWeekRangeLabel(anchorDate)
  return formatEventDate(selectedDate)
}

export function EventsToolbar() {
  const {
    surface,
    setSurface,
    calendarMode,
    setCalendarMode,
    anchorDate,
    setAnchorDate,
    selectedDate,
    setSelectedDate,
  } = useEventsUi()

  const shift = (direction: -1 | 1) => {
    if (surface === 'list' || calendarMode === 'month') {
      const next = addMonths(anchorDate, direction)
      setAnchorDate(next)
      setSelectedDate(toDateKey(next))
      return
    }
    if (calendarMode === 'week') {
      const next = addDays(startOfWeekSaturday(anchorDate), direction * 7)
      setAnchorDate(next)
      setSelectedDate(toDateKey(next))
      return
    }
    const next = addDays(parseDateKey(selectedDate), direction)
    setAnchorDate(next)
    setSelectedDate(toDateKey(next))
  }

  const goToday = () => {
    const today = new Date()
    setAnchorDate(today)
    setSelectedDate(toDateKey(today))
  }

  return (
    <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
      <div className='flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center'>
        <Tabs
          value={surface}
          onValueChange={(value) => setSurface(value as EventsSurface)}
        >
          <TabsList className='grid h-9 w-full grid-cols-2 sm:w-fit' aria-label='نمای رویدادها'>
            <TabsTrigger value='calendar' className='gap-1.5 px-3'>
              <CalendarDays className='size-3.5' />
              تقویم
            </TabsTrigger>
            <TabsTrigger value='list' className='gap-1.5 px-3'>
              <List className='size-3.5' />
              لیست
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {surface === 'calendar' && (
          <Tabs
            value={calendarMode}
            onValueChange={(value) =>
              setCalendarMode(value as EventsCalendarMode)
            }
          >
            <TabsList className='grid h-9 w-full grid-cols-3 sm:w-fit' aria-label='بازه تقویم'>
              <TabsTrigger value='day'>روزانه</TabsTrigger>
              <TabsTrigger value='week'>هفتگی</TabsTrigger>
              <TabsTrigger value='month'>ماهانه</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <div className='flex min-w-0 items-center gap-2'>
        <div className='flex min-w-0 flex-1 items-center gap-1'>
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='size-9 shrink-0'
            onClick={() => shift(-1)}
            aria-label='بازه قبلی'
          >
            <ChevronRight className='size-4' />
          </Button>
          <p className='min-w-0 flex-1 truncate text-center text-sm font-medium tabular-nums'>
            {getNavLabel(surface, calendarMode, anchorDate, selectedDate)}
          </p>
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='size-9 shrink-0'
            onClick={() => shift(1)}
            aria-label='بازه بعدی'
          >
            <ChevronLeft className='size-4' />
          </Button>
        </div>
        <Button type='button' variant='secondary' size='sm' className='shrink-0' onClick={goToday}>
          امروز
        </Button>
      </div>
    </div>
  )
}
