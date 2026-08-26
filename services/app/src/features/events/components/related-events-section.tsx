'use client'

import Link from 'next/link'
import { CalendarDays, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEventsHydration } from '../hooks/use-events-hydration'
import { useEventsStore } from '../stores/events-store'
import {
  compareEventsByStart,
  formatEventDate,
  formatTimeRange,
  getTemporalStatus,
  toDateKey,
} from '../utils/datetime'
import type { Event } from '../types'
import { EventTypeBadge } from './event-type-badge'

type RelatedEventsSectionProps = {
  /** فیلتر بر اساس پرونده */
  caseId?: string
  /** فیلتر بر اساس موکل */
  clientId?: string
  /** برای پیش‌پر کردن فرم ایجاد در صفحه رویدادها */
  defaultClientId?: string | null
  title?: string
  description?: string
}

function buildCreateHref(options: {
  caseId?: string
  clientId?: string | null
}): string {
  const params = new URLSearchParams()
  params.set('create', '1')
  if (options.caseId) params.set('caseId', options.caseId)
  if (options.clientId) params.set('clientId', options.clientId)
  return `/admin/events?${params.toString()}`
}

function sortRelated(events: Event[]): Event[] {
  const now = new Date()
  const todayKey = toDateKey(now)
  const upcoming = events
    .filter((event) => event.date >= todayKey)
    .sort(compareEventsByStart)
  const past = events
    .filter((event) => event.date < todayKey)
    .sort((a, b) => compareEventsByStart(b, a))
  return [...upcoming, ...past]
}

export function RelatedEventsSection({
  caseId,
  clientId,
  defaultClientId,
  title = 'رویدادهای مرتبط',
  description = 'جلسات، دادگاه‌ها و مهلت‌های متصل به این بخش.',
}: RelatedEventsSectionProps) {
  const { hydrated } = useEventsHydration({ seedIfEmpty: false })
  const events = useEventsStore((state) => state.events)

  const related = sortRelated(
    events.filter((event) => {
      if (caseId && event.caseId === caseId) return true
      if (clientId && event.clientId === clientId) return true
      return false
    })
  )

  const createHref = buildCreateHref({
    caseId,
    clientId: defaultClientId ?? clientId ?? null,
  })

  if (!hydrated) {
    return (
      <section className='space-y-4'>
        <div>
          <h3 className='text-base font-semibold tracking-tight'>{title}</h3>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-16 w-full rounded-xl' />
          <Skeleton className='h-16 w-full rounded-xl' />
        </div>
      </section>
    )
  }

  return (
    <section className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h3 className='text-base font-semibold tracking-tight'>{title}</h3>
          <p className='text-sm text-muted-foreground'>{description}</p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button asChild variant='outline' size='sm'>
            <Link href='/admin/events'>مشاهده تقویم</Link>
          </Button>
          <Button asChild size='sm'>
            <Link href={createHref}>
              <Plus className='size-4' />
              ایجاد رویداد
            </Link>
          </Button>
        </div>
      </div>

      {related.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center'>
          <div className='mb-3 flex size-11 items-center justify-center rounded-full bg-muted'>
            <CalendarDays className='size-5 text-muted-foreground' />
          </div>
          <p className='text-sm font-medium'>رویداد مرتبطی ثبت نشده</p>
          <p className='mt-1 max-w-sm text-xs text-muted-foreground'>
            جلسات و مهلت‌های این بخش را ثبت کنید تا اینجا دیده شوند.
          </p>
          <Button asChild variant='outline' size='sm' className='mt-4'>
            <Link href={createHref}>
              <Plus className='size-4' />
              ایجاد رویداد
            </Link>
          </Button>
        </div>
      ) : (
        <ul className='space-y-2'>
          {related.map((event) => {
            const temporal = getTemporalStatus(event)
            return (
              <li key={event.id}>
                <Link
                  href='/admin/events'
                  className={`flex flex-col gap-2 rounded-xl border bg-background p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between ${
                    temporal === 'past' ? 'opacity-60' : ''
                  } ${temporal === 'today' ? 'border-foreground/20 bg-accent/20' : ''}`}
                >
                  <div className='min-w-0 space-y-1.5'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='truncate font-semibold tracking-tight'>
                        {event.title}
                      </p>
                      <EventTypeBadge type={event.type} />
                      {temporal === 'today' && (
                        <span className='text-[11px] font-medium text-foreground'>
                          امروز
                        </span>
                      )}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      <span className='tabular-nums'>
                        {formatEventDate(event.date)}
                      </span>
                      {' · '}
                      <span className='tabular-nums'>
                        {formatTimeRange(event.startTime, event.endTime)}
                      </span>
                      {event.location ? ` · ${event.location}` : ''}
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
