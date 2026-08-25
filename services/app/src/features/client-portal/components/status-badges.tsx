'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  CLIENT_CASE_STATUS_LABELS,
  DOCUMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  SESSION_STATUS_LABELS,
  type ClientCaseStatus,
  type DocumentStatus,
  type PaymentStatus,
  type SessionStatus,
} from '../types'
import {
  caseStatusStyles,
  documentStatusStyles,
  paymentStatusStyles,
  sessionStatusStyles,
} from '../data/status-styles'

type BadgeProps = { className?: string }

export function CaseStatusBadge({
  status,
  className,
}: BadgeProps & { status: ClientCaseStatus }) {
  return (
    <Badge
      variant='outline'
      className={cn(caseStatusStyles.get(status), className)}
    >
      {CLIENT_CASE_STATUS_LABELS[status]}
    </Badge>
  )
}

export function SessionStatusBadge({
  status,
  className,
}: BadgeProps & { status: SessionStatus }) {
  return (
    <Badge
      variant='outline'
      className={cn(sessionStatusStyles.get(status), className)}
    >
      {SESSION_STATUS_LABELS[status]}
    </Badge>
  )
}

export function PaymentStatusBadge({
  status,
  className,
}: BadgeProps & { status: PaymentStatus }) {
  return (
    <Badge
      variant='outline'
      className={cn(paymentStatusStyles.get(status), className)}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  )
}

export function DocumentStatusBadge({
  status,
  className,
}: BadgeProps & { status: DocumentStatus }) {
  return (
    <Badge
      variant='outline'
      className={cn(documentStatusStyles.get(status), className)}
    >
      {DOCUMENT_STATUS_LABELS[status]}
    </Badge>
  )
}
