'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { EVENT_TYPE_LABELS, type EventType } from '../types'
import { eventTypeStyles } from '../data/event-styles'
import { isImportantEventType } from '../utils/datetime'

type EventTypeBadgeProps = {
  type: EventType
  className?: string
}

export function EventTypeBadge({ type, className }: EventTypeBadgeProps) {
  return (
    <Badge
      variant='outline'
      className={cn(
        eventTypeStyles.get(type),
        isImportantEventType(type) && 'font-semibold',
        className
      )}
    >
      {EVENT_TYPE_LABELS[type]}
    </Badge>
  )
}
