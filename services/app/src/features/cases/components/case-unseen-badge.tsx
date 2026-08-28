'use client'

import { UnseenActivityBadge } from '@/features/notifications/components/unseen-activity-badge'
import { useCaseUnseenActivity } from '@/features/notifications/hooks/use-unseen-activity-hydration'

type CaseUnseenBadgeProps = {
  caseId: string
}

export function CaseUnseenBadge({ caseId }: CaseUnseenBadgeProps) {
  const activity = useCaseUnseenActivity(caseId)

  return (
    <UnseenActivityBadge
      count={activity?.total ?? 0}
      comments={activity?.comments}
      documents={activity?.documents}
    />
  )
}
