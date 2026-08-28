'use client'

import Link from 'next/link'
import { LongText } from '@/components/long-text'
import {
  useClientUnseenBreakdown,
  useClientUnseenTotal,
} from '@/features/notifications/hooks/use-unseen-activity-hydration'
import { UnseenActivityBadge } from '@/features/notifications/components/unseen-activity-badge'
import { ClientAvatar } from './client-avatar'

type ClientNameWithBadgeProps = {
  clientId: string
  name: string
  avatarDataUrl?: string
  href: string
  className?: string
}

export function ClientNameWithBadge({
  clientId,
  name,
  avatarDataUrl,
  href,
  className,
}: ClientNameWithBadgeProps) {
  const total = useClientUnseenTotal(clientId)
  const breakdown = useClientUnseenBreakdown(clientId)

  return (
    <Link
      href={href}
      className={`flex min-w-0 items-center gap-3 hover:underline ${className ?? ''}`}
    >
      <ClientAvatar
        name={name}
        avatarDataUrl={avatarDataUrl}
        className='size-8 shrink-0'
        fallbackClassName='text-xs'
      />
      <LongText className='max-w-44 font-medium'>{name}</LongText>
      <UnseenActivityBadge
        count={total}
        comments={breakdown?.comments}
        documents={breakdown?.documents}
      />
    </Link>
  )
}
