'use client'

import type { Event } from '../types'
import { summarizeEvents } from '../utils/filters'

type EventsSummaryProps = {
  events: Event[]
  now?: Date
}

const items = [
  {
    key: 'today',
    label: 'امروز',
    getValue: (summary: ReturnType<typeof summarizeEvents>) => summary.today,
  },
  {
    key: 'thisWeek',
    label: 'این هفته',
    getValue: (summary: ReturnType<typeof summarizeEvents>) => summary.thisWeek,
  },
  {
    key: 'upcoming',
    label: 'پیش‌رو',
    getValue: (summary: ReturnType<typeof summarizeEvents>) =>
      summary.upcoming,
  },
] as const

export function EventsSummary({ events, now }: EventsSummaryProps) {
  const summary = summarizeEvents(events, now)

  return (
    <div className='grid grid-cols-3 gap-2 sm:gap-3'>
      {items.map((item) => (
        <div
          key={item.key}
          className='rounded-lg border bg-background/60 px-3 py-3 sm:px-4'
        >
          <p className='text-[11px] leading-4 text-muted-foreground sm:text-xs'>
            {item.label}
          </p>
          <p className='mt-1 text-lg font-semibold tracking-tight tabular-nums sm:text-2xl'>
            {item.getValue(summary).toLocaleString('fa-IR')}
          </p>
        </div>
      ))}
    </div>
  )
}
