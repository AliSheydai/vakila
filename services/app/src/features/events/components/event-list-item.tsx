'use client'

import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Event } from '../types'
import {
  formatTimeRange,
  getTemporalStatus,
  isImportantEventType,
} from '../utils/datetime'
import { EventTypeBadge } from './event-type-badge'

export type EventLookup = {
  clientNameById: Record<string, string>
  caseTitleById: Record<string, string>
}

type EventListItemProps = {
  event: Event
  lookup: EventLookup
  now?: Date
  onSelect?: (event: Event) => void
  compact?: boolean
}

export function EventListItem({
  event,
  lookup,
  now,
  onSelect,
  compact = false,
}: EventListItemProps) {
  const temporal = getTemporalStatus(event, now)
  const clientName = event.clientId
    ? lookup.clientNameById[event.clientId]
    : undefined
  const caseTitle = event.caseId
    ? lookup.caseTitleById[event.caseId]
    : undefined

  return (
    <button
      type='button'
      onClick={() => onSelect?.(event)}
      aria-label={`${event.title}، ${formatTimeRange(event.startTime, event.endTime)}`}
      className={cn(
        'flex min-h-11 w-full gap-3 rounded-lg border bg-background/70 px-3 py-3 text-start transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        temporal === 'past' && 'opacity-55',
        temporal === 'today' && 'border-foreground/20 bg-accent/30',
        isImportantEventType(event.type) &&
          temporal !== 'past' &&
          'ring-1 ring-inset ring-rose-500/25',
        compact && 'px-2.5 py-2'
      )}
    >
      <div
        className={cn(
          'mt-0.5 w-1 shrink-0 self-stretch rounded-full',
          event.type === 'legal_deadline' && 'bg-rose-500',
          event.type === 'court_hearing' && 'bg-amber-500',
          event.type === 'client_meeting' && 'bg-sky-500',
          event.type === 'online_meeting' && 'bg-teal-500',
          event.type === 'reminder' && 'bg-neutral-400',
          event.type === 'other' && 'bg-muted-foreground/40'
        )}
      />
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm font-medium tabular-nums text-muted-foreground'>
            {formatTimeRange(event.startTime, event.endTime)}
          </span>
          <EventTypeBadge type={event.type} />
        </div>
        <p className={cn('mt-1 font-medium', compact ? 'text-sm' : 'text-base')}>
          {event.title}
        </p>
        {(clientName || caseTitle || event.location) && (
          <div className='mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground sm:text-sm'>
            {clientName && <span>{clientName}</span>}
            {caseTitle && <span>{caseTitle}</span>}
            {event.location ? (
              <span className='inline-flex items-center gap-1'>
                <MapPin className='size-3.5 shrink-0' />
                {event.location}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </button>
  )
}
