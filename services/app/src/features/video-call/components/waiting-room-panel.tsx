'use client'

import { useState } from 'react'
import { useParticipants } from '@livekit/components-react'
import { UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

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
    <div className='border-b bg-amber-50 px-4 py-3 dark:bg-amber-950/30'>
      <p className='mb-2 text-sm font-medium'>در انتظار پذیرش</p>
      <ul className='space-y-2'>
        {waiting.map((p) => (
          <li
            key={p.identity}
            className='flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2'
          >
            <span className='text-sm'>{p.name || 'موکل'}</span>
            <div className='flex gap-2'>
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
    </div>
  )
}
