'use client'

import type { Event } from '../types'
import {
  formatEventDate,
  formatEventWeekday,
  formatMonthTitle,
  toDateKey,
  compareEventsByStart,
} from '../utils/datetime'
import { useEventsUi } from './events-provider'
import { EventListItem, type EventLookup } from './event-list-item'

type EventsListProps = {
  events: Event[]
  lookup: EventLookup
  /** اگر true فقط رویدادهای ماهِ anchor نمایش داده می‌شود */
  scopeToAnchorMonth?: boolean
  now?: Date
}

function groupByDate(events: Event[]): Array<[string, Event[]]> {
  const map = new Map<string, Event[]>()
  for (const event of events) {
    const list = map.get(event.date) ?? []
    list.push(event)
    map.set(event.date, list)
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
}

export function EventsList({
  events,
  lookup,
  scopeToAnchorMonth = false,
  now = new Date(),
}: EventsListProps) {
  const { anchorDate, openDetail } = useEventsUi()

  const scoped = scopeToAnchorMonth
    ? events.filter((event) => {
        const [y, m] = event.date.split('-').map(Number)
        return (
          y === anchorDate.getFullYear() && m === anchorDate.getMonth() + 1
        )
      })
    : events

  const sorted = scoped.slice().sort(compareEventsByStart)
  const groups = groupByDate(sorted)
  const todayKey = toDateKey(now)

  if (sorted.length === 0) {
    return (
      <div className='rounded-xl border border-dashed px-4 py-12 text-center'>
        <p className='text-sm font-medium'>
          {scopeToAnchorMonth
            ? `در ${formatMonthTitle(anchorDate)} رویدادی ندارید.`
            : 'رویدادی برای نمایش نیست.'}
        </p>
        <p className='mt-1 text-sm text-muted-foreground'>
          با ایجاد رویداد، برنامه کاری اینجا دیده می‌شود.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {groups.map(([date, dayEvents]) => {
        const isToday = date === todayKey
        return (
          <section key={date} className='space-y-2' aria-labelledby={`events-day-${date}`}>
            <div className='flex items-baseline gap-2'>
              <h3
                id={`events-day-${date}`}
                className={
                  isToday
                    ? 'text-sm font-semibold'
                    : 'text-sm font-medium text-muted-foreground'
                }
              >
                {isToday ? 'امروز' : formatEventWeekday(date)}
              </h3>
              <span className='text-xs tabular-nums text-muted-foreground'>
                {formatEventDate(date)}
              </span>
            </div>
            <div className='space-y-2'>
              {dayEvents.map((event) => (
                <EventListItem
                  key={event.id}
                  event={event}
                  lookup={lookup}
                  now={now}
                  onSelect={openDetail}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
