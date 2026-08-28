'use client'

import { UnseenActivityBadge } from '@/features/notifications/components/unseen-activity-badge'
import { useCaseNotificationBadge } from '@/features/notifications/hooks/use-unseen-activity-hydration'

type CaseNotificationBadgeProps = {
  caseId: string
}

export function CaseNotificationBadge({ caseId }: CaseNotificationBadgeProps) {
  const count = useCaseNotificationBadge(caseId)
  return <UnseenActivityBadge count={count} />
}
