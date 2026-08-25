'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { CASE_STATUS_LABELS, type CaseStatus } from '../types'
import { caseStatusStyles } from '../data/status-styles'

type CaseStatusBadgeProps = {
  status: CaseStatus
  className?: string
}

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  return (
    <Badge
      variant='outline'
      className={cn(caseStatusStyles.get(status), className)}
    >
      {CASE_STATUS_LABELS[status]}
    </Badge>
  )
}
