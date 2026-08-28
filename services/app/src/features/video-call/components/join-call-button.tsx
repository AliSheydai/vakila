'use client'

import Link from 'next/link'
import { Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCallWindow } from '../hooks/use-call-window'

type JoinCallButtonProps = {
  eventId: string
  date: string
  startTime: string
  endTime: string
  status: string
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function JoinCallButton({
  eventId,
  date,
  startTime,
  endTime,
  status,
  variant = 'default',
  size = 'default',
  className,
}: JoinCallButtonProps) {
  const { canJoin, state, msUntilOpen } = useCallWindow({
    date,
    startTime,
    endTime,
    status,
  })

  if (state === 'cancelled' || state === 'ended') {
    return null
  }

  const lobbyHref = `/call/${eventId}/lobby`

  if (!canJoin) {
    return (
      <Button variant='outline' size={size} className={className} disabled>
        <Video className='size-4' />
        ورود از{' '}
        {Math.ceil(msUntilOpen / 60_000).toLocaleString('fa-IR')} دقیقه دیگر
      </Button>
    )
  }

  return (
    <Button variant={variant} size={size} className={className} asChild>
      <Link href={lobbyHref}>
        <Video className='size-4' />
        ورود به جلسه
      </Link>
    </Button>
  )
}
