'use client'

import { UnseenActivityBadge } from '@/features/notifications/components/unseen-activity-badge'
import { useCaseUnseenActivity } from '@/features/notifications/hooks/use-unseen-activity-hydration'

type CaseClientNameCellProps = {
  caseId: string
  clientName: string
}

export function CaseClientNameCell({
  caseId,
  clientName,
}: CaseClientNameCellProps) {
  const activity = useCaseUnseenActivity(caseId)

  return (
    <div className='flex min-w-0 items-center gap-2'>
      <span className='truncate max-w-36'>{clientName}</span>
      <UnseenActivityBadge
        count={activity?.total ?? 0}
        comments={activity?.comments}
        documents={activity?.documents}
      />
    </div>
  )
}
