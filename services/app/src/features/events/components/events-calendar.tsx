'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    openDetail,
    openCreate,
  } = useEventsUi()
  const grid = getMonthGrid(anchorDate)
  const todayKey = toDateKey(now)
  const month = anchorDate.getMonth()

  return (
    <div
      className='overflow-hidden rounded-xl border'
      role='grid'
      aria-label='تقویم ماهانه'
    >
      <div className='grid grid-cols-7 border-b bg-muted/40' role='row'>
        {WEEKDAY_HEADERS.map((label, index) => (
          <div
            key={`${label}-${index}`}
            role='columnheader'
            className='px-0.5 py-2 text-center text-[10px] font-medium text-muted-foreground sm:px-1 sm:text-xs'
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
              role='gridcell'
              aria-selected={isSelected}
              className={cn(
                'flex min-h-16 flex-col gap-0.5 border-e border-b p-1 [&:nth-child(7n)]:border-e-0 sm:min-h-24 sm:gap-1 sm:p-2',
                !inMonth && 'bg-muted/20 text-muted-foreground',
                isSelected && 'bg-accent/50',
                isToday && 'bg-accent/30'
              )}
            >
              <div className='flex items-center justify-between gap-0.5'>
                <button
                  type='button'
                  onClick={() => {
                    setSelectedDate(key)
                    setAnchorDate(day)
                  }}
                  onDoubleClick={() => {
                    setSelectedDate(key)
                    setAnchorDate(day)
                    openCreate({
                      date: key,
                      startTime: '10:00',
                      endTime: '11:00',
                    })
                  }}
                  className={cn(
                    'inline-flex size-8 items-center justify-center rounded-full text-xs tabular-nums transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-7 sm:text-sm',
                    isToday &&
                      'bg-foreground font-semibold text-background hover:bg-foreground',
                    temporal === 'past' && !isToday && 'opacity-60'
                  )}
                  aria-label={`${formatEventDate(key)}${dayEvents.length ? `، ${dayEvents.length.toLocaleString('fa-IR')} رویداد` : ''}`}
                  aria-current={isToday ? 'date' : undefined}
                  title='برای ایجاد رویداد، دکمه افزودن را بزنید'
                >
                  {formatDayNumber(day)}
                </button>
                {isSelected && (
                  <button
                    type='button'
                    className='inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden'
                    aria-label={`ایجاد رویداد در ${formatEventDate(key)}`}
                    onClick={() =>
                      openCreate({
                        date: key,
                        startTime: '10:00',
                        endTime: '11:00',
                      })
                    }
                  >
                    <Plus className='size-3.5' />
                  </button>
                )}
              </div>
              <div className='mt-auto flex justify-center gap-0.5 sm:hidden'>
                {dayEvents.slice(0, 3).map((event) => (
                  <span
                    key={event.id}
                    className={cn(
                      'size-1.5 rounded-full',
                      event.type === 'legal_deadline' && 'bg-rose-500',
                      event.type === 'court_hearing' && 'bg-amber-500',
                      event.type === 'client_meeting' && 'bg-sky-500',
                      event.type === 'online_meeting' && 'bg-teal-500',
                      event.type === 'reminder' && 'bg-neutral-400',
                      event.type === 'other' && 'bg-muted-foreground/50',
                      getTemporalStatus(event, now) === 'past' && 'opacity-40'
                    )}
                  />
                ))}
              </div>
              <div className='hidden flex-1 flex-col gap-0.5 overflow-hidden sm:flex'>
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    type='button'
                    onClick={() => openDetail(event)}
                    aria-label={`${event.title}، ${formatEventTime(event.startTime)}`}
                    className={cn(
                      'truncate rounded px-1 py-0.5 text-start text-[11px] leading-4 ring-1 ring-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      eventBlockStyles.get(event.type),
                      getTemporalStatus(event, now) === 'past' && 'opacity-50',
                      isImportantEventType(event.type) && 'font-medium'
                    )}
                  >
                    <span className='tabular-nums'>
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
    openDetail,
    openCreate,
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
                'flex min-h-28 flex-col border-b border-e last:border-e-0 sm:min-h-64 sm:[&:nth-child(7n)]:border-e-0',
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
                onDoubleClick={() => {
                  setSelectedDate(key)
                  setAnchorDate(day)
                  openCreate({
                    date: key,
                    startTime: '10:00',
                    endTime: '11:00',
                  })
                }}
                className='flex min-h-11 items-center justify-between gap-2 border-b px-2 py-2 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:flex-col sm:items-start'
                aria-label={`${formatWeekdayShort(day)} ${formatDayNumber(day)}`}
                title='برای ایجاد رویداد، افزودن را بزنید'
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
                  <button
                    type='button'
                    onClick={() =>
                      openCreate({
                        date: key,
                        startTime: '10:00',
                        endTime: '11:00',
                      })
                    }
                    className='min-h-11 rounded-md border border-dashed px-1 py-2 text-[11px] text-muted-foreground hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  >
                    افزودن
                  </button>
                ) : (
                  dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type='button'
                      onClick={() => openDetail(event)}
                      aria-label={`${event.title}، ${formatEventTime(event.startTime)}`}
                      className={cn(
                        'rounded-md px-1.5 py-1 text-start text-[11px] leading-4 ring-1 ring-inset transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
  const { selectedDate, openDetail, openCreate } = useEventsUi()
  const dayEvents = getEventsByDate(events, selectedDate)
  const temporal = getDateTemporalStatus(selectedDate, now)

  return (
    <div className='rounded-xl border'>
      <div
        className={cn(
          'flex items-center justify-between gap-3 border-b px-4 py-3',
          temporal === 'today' && 'bg-accent/40'
        )}
      >
        <div>
          <p className='text-sm font-semibold'>
            {temporal === 'today' ? 'امروز' : formatEventWeekday(selectedDate)}
          </p>
          <p className='mt-0.5 text-sm tabular-nums text-muted-foreground'>
            {formatEventDate(selectedDate)}
          </p>
        </div>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() =>
            openCreate({
              date: selectedDate,
              startTime: '10:00',
              endTime: '11:00',
            })
          }
        >
          <Plus className='size-4' />
          رویداد
        </Button>
      </div>
      <div className='space-y-2 p-3 sm:p-4'>
        {dayEvents.length === 0 ? (
          <div className='py-10 text-center'>
            <p className='text-sm text-muted-foreground'>
              {temporal === 'today'
                ? 'امروز رویدادی ندارید.'
                : 'در این روز رویدادی ندارید.'}
            </p>
            <Button
              type='button'
              className='mt-4'
              onClick={() =>
                openCreate({
                  date: selectedDate,
                  startTime: '10:00',
                  endTime: '11:00',
                })
              }
            >
              <Plus className='size-4' />
              ایجاد رویداد
            </Button>
          </div>
        ) : (
          dayEvents.map((event) => (
            <EventListItem
              key={event.id}
              event={event}
              lookup={lookup}
              now={now}
              onSelect={openDetail}
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
  const { selectedDate, openDetail, openCreate } = useEventsUi()
  const dayEvents = getEventsByDate(events, selectedDate)
  const temporal = getDateTemporalStatus(selectedDate, now)

  return (
    <aside className='rounded-xl border'>
      <div
        className={cn(
          'flex items-center justify-between gap-2 border-b px-4 py-3',
          temporal === 'today' && 'bg-accent/40'
        )}
      >
        <div className='min-w-0'>
          <p className='text-sm font-semibold'>
            {temporal === 'today'
              ? 'رویدادهای امروز'
              : `رویدادهای ${formatEventWeekday(selectedDate)}`}
          </p>
          <p className='mt-0.5 text-xs tabular-nums text-muted-foreground'>
            {formatEventDate(selectedDate)}
          </p>
        </div>
        <Button
          type='button'
          size='icon'
          variant='outline'
          className='size-8 shrink-0'
          onClick={() =>
            openCreate({
              date: selectedDate,
              startTime: '10:00',
              endTime: '11:00',
            })
          }
          aria-label='ایجاد رویداد'
        >
          <Plus className='size-4' />
        </Button>
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
              onSelect={openDetail}
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
