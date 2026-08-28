'use client'

import { useEffect, useState } from 'react'
import { VideoLobby } from '@/features/video-call/components/video-lobby'
import { CallEndedState } from '@/features/video-call/components/call-ended-state'

type CallInfo = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  status: string
  role: 'host' | 'client'
}

type LobbyPageClientProps = {
  eventId: string
}

export function LobbyPageClient({ eventId }: LobbyPageClientProps) {
  const [info, setInfo] = useState<CallInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/call-info`, {
          credentials: 'include',
        })
        const json = (await res.json()) as {
          ok: boolean
          data?: CallInfo
          error?: string
        }
        if (!json.ok || !json.data) {
          setError(json.error ?? 'بارگذاری اطلاعات جلسه ناموفق بود.')
          return
        }
        setInfo(json.data)
      } catch {
        setError('خطا در اتصال به سرور.')
      } finally {
        setLoading(false)
      }
    })()
  }, [eventId])

  if (loading) {
    return (
      <div className='flex min-h-dvh items-center justify-center'>
        <p className='text-sm text-muted-foreground'>در حال بارگذاری…</p>
      </div>
    )
  }

  if (error || !info) {
    return (
      <CallEndedState
        title='Lobby در دسترس نیست'
        message={error ?? 'خطای ناشناخته'}
        backHref='/sessions'
      />
    )
  }

  return (
    <VideoLobby
      eventId={info.id}
      eventTitle={info.title}
      date={info.date}
      startTime={info.startTime}
      endTime={info.endTime}
      status={info.status}
      role={info.role}
    />
  )
}
