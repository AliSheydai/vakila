'use client'

import { VideoRoom } from '@/features/video-call/components/video-room'
import { CallEndedState } from '@/features/video-call/components/call-ended-state'
import { useVideoToken } from '@/features/video-call/hooks/use-video-token'
import { useEffect, useState } from 'react'

type CallPageClientProps = {
  eventId: string
}

export function CallPageClient({ eventId }: CallPageClientProps) {
  const [role, setRole] = useState<'host' | 'client' | null>(null)

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/events/${eventId}/call-info`, {
        credentials: 'include',
      })
      const json = (await res.json()) as {
        ok: boolean
        data?: { role: 'host' | 'client' }
      }
      if (json.ok && json.data) {
        setRole(json.data.role)
      } else {
        setRole('client')
      }
    })()
  }, [eventId])

  const skipWaiting = role === 'host'
  const { data, error, loading } = useVideoToken({
    eventId,
    skipWaiting: skipWaiting ?? false,
    enabled: role !== null,
  })

  if (role === null || loading) {
    return (
      <div className='flex min-h-dvh items-center justify-center'>
        <p className='text-sm text-muted-foreground'>در حال اتصال به جلسه…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <CallEndedState
        title='ورود به جلسه ممکن نیست'
        message={error ?? 'خطای ناشناخته'}
        backHref={role === 'host' ? '/admin/events' : `/sessions/${eventId}`}
      />
    )
  }

  return <VideoRoom eventId={eventId} tokenData={data} />
}
