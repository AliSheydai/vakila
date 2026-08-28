'use client'

import {
  CONSULTATION_REQUEST_STATUS_LABELS,
  type ConsultationRequestStatus,
} from '../types'

const STATUS_VARIANTS: Record<
  ConsultationRequestStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  new: 'default',
  in_review: 'secondary',
  contacted: 'outline',
  closed: 'outline',
}

type RequestStatusBadgeProps = {
  status: ConsultationRequestStatus
  className?: string
}

export function RequestStatusBadge({ status, className }: RequestStatusBadgeProps) {
  const variant = STATUS_VARIANTS[status]
  return (
    <span
      className={
        className ??
        `inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
          variant === 'default'
            ? 'border-transparent bg-primary text-primary-foreground'
            : variant === 'secondary'
              ? 'border-transparent bg-secondary text-secondary-foreground'
              : 'border-border bg-background text-muted-foreground'
        }`
      }
    >
      {CONSULTATION_REQUEST_STATUS_LABELS[status]}
    </span>
  )
}
