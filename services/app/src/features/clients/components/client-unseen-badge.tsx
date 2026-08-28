'use client'

import {
  useClientUnseenBreakdown,
  useClientUnseenTotal,
} from '@/features/notifications/hooks/use-unseen-activity-hydration'
import { UnseenActivityBadge } from '@/features/notifications/components/unseen-activity-badge'

type ClientUnseenBadgeProps = {
  clientId: string
}

export function ClientUnseenBadge({ clientId }: ClientUnseenBadgeProps) {
  const total = useClientUnseenTotal(clientId)
  const breakdown = useClientUnseenBreakdown(clientId)

  return (
    <UnseenActivityBadge
      count={total}
      comments={breakdown?.comments}
      documents={breakdown?.documents}
    />
  )
}
