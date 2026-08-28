'use client'

import { useState } from 'react'
import { useParticipants } from '@livekit/components-react'
import { Clock3, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDisplayName } from '../utils/participant'

type WaitingRoomPanelProps = {
  eventId: string
}

export function WaitingRoomPanel({ eventId }: WaitingRoomPanelProps) {
  const participants = useParticipants()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const waiting = participants.filter((p) => {
    if (p.isLocal) return false
    try {
      const meta = p.metadata ? (JSON.parse(p.metadata) as { role?: string }) : null
      return meta?.role === 'client' && !p.permissions?.canPublish
    } catch {
      return false
    }
  })

  if (waiting.length === 0) return null

  const handleAction = async (
    participantId: string,
    action: 'admit' | 'reject'
  ) => {
    setLoadingId(participantId)
    try {
      const res = await fetch(`/api/events/${eventId}/admit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, action }),
      })
      const json = (await res.json()) as { ok: boolean; error?: string }
      if (!json.ok) {
        toast.error(json.error ?? 'عملیات ناموفق بود.')
        return
      }
      toast.success(action === 'admit' ? 'موکل پذیرفته شد.' : 'درخواست رد شد.')
    } catch {
      toast.error('خطا در ارتباط با سرور.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <section className='border-b border-primary/20 bg-primary/5 px-4 py-3 sm:px-5'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Clock3 className='size-4 text-primary' />
          <p className='text-sm font-medium'>اتاق انتظار</p>
        </div>
        <Badge variant='outline' className='border-primary/30 bg-background/80'>
          {waiting.length} نفر در انتظار
        </Badge>
      </div>
      <ul className='space-y-2'>
        {waiting.map((p) => (
          <li
            key={p.identity}
            className='flex flex-col gap-3 rounded-xl border border-border/60 bg-card/90 px-3 py-3 sm:flex-row sm:items-center sm:justify-between'
          >
            <div className='min-w-0 text-start'>
              <p className='truncate text-sm font-medium'>
                {getDisplayName(p)}
              </p>
              <p className='text-xs text-muted-foreground'>
                درخواست ورود به جلسه
              </p>
            </div>
            <div className='flex shrink-0 gap-2'>
              <Button
                size='sm'
                disabled={loadingId === p.identity}
                onClick={() => void handleAction(p.identity, 'admit')}
              >
                <UserCheck className='size-4' />
                پذیرش
              </Button>
              <Button
                size='sm'
                variant='outline'
                disabled={loadingId === p.identity}
                onClick={() => void handleAction(p.identity, 'reject')}
              >
                <UserX className='size-4' />
                رد
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
