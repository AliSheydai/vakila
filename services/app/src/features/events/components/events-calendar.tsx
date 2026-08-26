'use client'

import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Event } from '../types'
import { eventBlockStyles } from '../data/event-styles'
import {
  formatDayNumber,
  formatEventDate,
  formatEventTime,
  formatEventWeekday,
  formatWeekdayShort,
  getDateTemporalStatus,
  getMonthGrid,
  getTemporalStatus,
  getWeekDays,
  isImportantEventType,
  toDateKey,
} from '../utils/datetime'
import { getEventsByDate } from '../utils/filters'
import { useEventsUi } from './events-provider'
import { EventListItem, type EventLookup } from './event-list-item'

type EventsCalendarProps = {
  events: Event[]
  lookup: EventLookup
  now?: Date
}

const WEEKDAY_HEADERS = (() => {
  const days = getWeekDays(new Date())
  return days.map((day) => formatWeekdayShort(day))
})()

function selectEvent(
  event: Event,
  setCurrentRow: (event: Event | null) => void,
  setOpen: (value: 'detail' | null) => void
) {
  setCurrentRow(event)
  setOpen('detail')
  toast.message('جزئیات کامل و ویرایش در فاز بعدی فعال می‌شود.')
}

function MonthView({
  events,
  now,
}: {
  events: Event[]
  now: Date
}) {
  const {
    anchorDate,
    selectedDate,
    setSelectedDate,
    setAnchorDate,
    setCurrentRow,
    setOpen,
  } = useEventsUi()
  const grid = getMonthGrid(anchorDate)
  const todayKey = toDateKey(now)
  const month = anchorDate.getMonth()

  return (
    <div className='overflow-hidden rounded-xl border'>
      <div className='grid grid-cols-7 border-b bg-muted/40'>
        {WEEKDAY_HEADERS.map((label) => (
          <div
            key={label}
            className='px-1 py-2 text-center text-[11px] font-medium text-muted-foreground sm:text-xs'
          >
            {label}
          </div>
        ))}
      </div>
      <div className='grid grid-cols-7'>
        {grid.map((day) => {
          const key = toDateKey(day)
          const dayEvents = getEventsByDate(events, key)
          const inMonth = day.getMonth() === month
          const isSelected = key === selectedDate
          const isToday = key === todayKey
          const temporal = getDateTemporalStatus(key, now)

          return (
            <div
              key={key}
              className={cn(
                'flex min-h-20 flex-col gap-1 border-e border-b p-1.5 last:border-e-0 sm:min-h-24 sm:p-2',
                !inMonth && 'bg-muted/20 text-muted-foreground',
                isSelected && 'bg-accent/50',
                isToday && 'bg-accent/30'
              )}
            >
              <button
                type='button'
                onClick={() => {
                  setSelectedDate(key)
                  setAnchorDate(day)
                }}
                className={cn(
                  'inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums transition-colors hover:bg-muted sm:size-7 sm:text-sm',
                  isToday && 'bg-foreground font-semibold text-background hover:bg-foreground',
                  temporal === 'past' && !isToday && 'opacity-60'
                )}
                aria-label={formatEventDate(key)}
              >
                {formatDayNumber(day)}
              </button>
              <div className='flex flex-1 flex-col gap-0.5 overflow-hidden'>
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    type='button'
                    onClick={() =>
                      selectEvent(event, setCurrentRow, setOpen)
                    }
                    className={cn(
                      'truncate rounded px-1 py-0.5 text-start text-[10px] leading-4 ring-1 ring-inset sm:text-[11px]',
                      eventBlockStyles.get(event.type),
                      getTemporalStatus(event, now) === 'past' && 'opacity-50',
                      isImportantEventType(event.type) && 'font-medium'
                    )}
                  >
                    <span className='hidden tabular-nums sm:inline'>
                      {formatEventTime(event.startTime)}{' '}
                    </span>
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <button
                    type='button'
                    onClick={() => {
                      setSelectedDate(key)
                      setAnchorDate(day)
                    }}
                    className='px-1 text-start text-[10px] text-muted-foreground'
                  >
                    +{(dayEvents.length - 3).toLocaleString('fa-IR')} مورد دیگر
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({
  events,
  now,
}: {
  events: Event[]
  now: Date
}) {
  const {
    anchorDate,
    selectedDate,
    setSelectedDate,
    setAnchorDate,
    setCurrentRow,
    setOpen,
  } = useEventsUi()
  const days = getWeekDays(anchorDate)
  const todayKey = toDateKey(now)

  return (
    <div className='overflow-hidden rounded-xl border'>
      <div className='grid grid-cols-1 sm:grid-cols-7'>
        {days.map((day) => {
          const key = toDateKey(day)
          const dayEvents = getEventsByDate(events, key)
          const isSelected = key === selectedDate
          const isToday = key === todayKey

          return (
            <div
              key={key}
              className={cn(
                'flex min-h-36 flex-col border-b border-e last:border-e-0 sm:min-h-64',
                isSelected && 'bg-accent/40',
                isToday && !isSelected && 'bg-accent/20'
              )}
            >
              <button
                type='button'
                onClick={() => {
                  setSelectedDate(key)
                  setAnchorDate(day)
                }}
                className='flex items-center justify-between gap-2 border-b px-2 py-2 text-start sm:flex-col sm:items-start'
              >
                <span className='text-xs text-muted-foreground'>
                  {formatWeekdayShort(day)}
                </span>
                <span
                  className={cn(
                    'inline-flex size-7 items-center justify-center rounded-full text-sm tabular-nums',
                    isToday && 'bg-foreground font-semibold text-background'
                  )}
                >
                  {formatDayNumber(day)}
                </span>
              </button>
              <div className='flex flex-1 flex-col gap-1 p-1.5'>
                {dayEvents.length === 0 ? (
                  <p className='px-1 py-2 text-[11px] text-muted-foreground'>
                    —
                  </p>
                ) : (
                  dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type='button'
                      onClick={() =>
                        selectEvent(event, setCurrentRow, setOpen)
                      }
                      className={cn(
                        'rounded-md px-1.5 py-1 text-start text-[11px] leading-4 ring-1 ring-inset transition-opacity hover:opacity-90',
                        eventBlockStyles.get(event.type),
                        getTemporalStatus(event, now) === 'past' &&
                          'opacity-50'
                      )}
                    >
                      <span className='block tabular-nums opacity-80'>
                        {formatEventTime(event.startTime)}
                      </span>
                      <span className='line-clamp-2 font-medium'>
                        {event.title}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayView({
  events,
  lookup,
  now,
}: {
  events: Event[]
  lookup: EventLookup
  now: Date
}) {
  const { selectedDate, setCurrentRow, setOpen } = useEventsUi()
  const dayEvents = getEventsByDate(events, selectedDate)
  const temporal = getDateTemporalStatus(selectedDate, now)

  return (
    <div className='rounded-xl border'>
      <div
        className={cn(
          'border-b px-4 py-3',
          temporal === 'today' && 'bg-accent/40'
        )}
      >
        <p className='text-sm font-semibold'>
          {temporal === 'today' ? 'امروز' : formatEventWeekday(selectedDate)}
        </p>
        <p className='mt-0.5 text-sm tabular-nums text-muted-foreground'>
          {formatEventDate(selectedDate)}
        </p>
      </div>
      <div className='space-y-2 p-3 sm:p-4'>
        {dayEvents.length === 0 ? (
          <p className='py-10 text-center text-sm text-muted-foreground'>
            {temporal === 'today'
              ? 'امروز رویدادی ندارید.'
              : 'در این روز رویدادی ندارید.'}
          </p>
        ) : (
          dayEvents.map((event) => (
            <EventListItem
              key={event.id}
              event={event}
              lookup={lookup}
              now={now}
              onSelect={(item) => selectEvent(item, setCurrentRow, setOpen)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function SelectedDaySidebar({
  events,
  lookup,
  now,
}: {
  events: Event[]
  lookup: EventLookup
  now: Date
}) {
  const { selectedDate, setCurrentRow, setOpen } = useEventsUi()
  const dayEvents = getEventsByDate(events, selectedDate)
  const temporal = getDateTemporalStatus(selectedDate, now)

  return (
    <aside className='rounded-xl border'>
      <div
        className={cn(
          'border-b px-4 py-3',
          temporal === 'today' && 'bg-accent/40'
        )}
      >
        <p className='text-sm font-semibold'>
          {temporal === 'today'
            ? 'رویدادهای امروز'
            : `رویدادهای ${formatEventWeekday(selectedDate)}`}
        </p>
        <p className='mt-0.5 text-xs tabular-nums text-muted-foreground'>
          {formatEventDate(selectedDate)}
        </p>
      </div>
      <div className='max-h-[28rem] space-y-2 overflow-y-auto p-3'>
        {dayEvents.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>
            رویدادی در این روز نیست.
          </p>
        ) : (
          dayEvents.map((event) => (
            <EventListItem
              key={event.id}
              event={event}
              lookup={lookup}
              now={now}
              compact
              onSelect={(item) => selectEvent(item, setCurrentRow, setOpen)}
            />
          ))
        )}
      </div>
    </aside>
  )
}

export function EventsCalendar({
  events,
  lookup,
  now = new Date(),
}: EventsCalendarProps) {
  const { calendarMode } = useEventsUi()

  return (
    <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]'>
      <div className='min-w-0 space-y-4'>
        {calendarMode === 'month' && <MonthView events={events} now={now} />}
        {calendarMode === 'week' && <WeekView events={events} now={now} />}
        {calendarMode === 'day' && (
          <DayView events={events} lookup={lookup} now={now} />
        )}
        {calendarMode !== 'day' && (
          <div className='xl:hidden'>
            <SelectedDaySidebar events={events} lookup={lookup} now={now} />
          </div>
        )}
      </div>
      {calendarMode !== 'day' && (
        <div className='hidden xl:block'>
          <SelectedDaySidebar events={events} lookup={lookup} now={now} />
        </div>
      )}
    </div>
  )
}
