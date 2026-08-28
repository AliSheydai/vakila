'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mic, MicOff, Video, VideoOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCallWindow, formatCountdown } from '../hooks/use-call-window'

type VideoLobbyProps = {
  eventId: string
  eventTitle: string
  date: string
  startTime: string
  endTime: string
  status: string
  role: 'host' | 'client'
}

export function VideoLobby({
  eventId,
  eventTitle,
  date,
  startTime,
  endTime,
  status,
  role,
}: VideoLobbyProps) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [micEnabled, setMicEnabled] = useState(true)
  const [camEnabled, setCamEnabled] = useState(true)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const { state, canJoin, msUntilOpen } = useCallWindow({
    date,
    startTime,
    endTime,
    status,
  })

  useEffect(() => {
    let active = true
    void navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((media) => {
        if (!active) {
          media.getTracks().forEach((t) => t.stop())
          return
        }
        setStream(media)
        if (videoRef.current) {
          videoRef.current.srcObject = media
        }
      })
      .catch(() => {
        setDeviceError(
          'دسترسی به دوربین یا میکروفون ممکن نشد. می‌توانید فقط با صدا وارد شوید.'
        )
      })
    return () => {
      active = false
      stream?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!stream || !videoRef.current) return
    videoRef.current.srcObject = stream
    stream.getVideoTracks().forEach((t) => {
      t.enabled = camEnabled
    })
    stream.getAudioTracks().forEach((t) => {
      t.enabled = micEnabled
    })
  }, [stream, camEnabled, micEnabled])

  const handleJoin = () => {
    stream?.getTracks().forEach((t) => t.stop())
    router.push(`/call/${eventId}`)
  }

  const handleInviteClient = async () => {
    setInviting(true)
    try {
      await fetch(`/api/events/${eventId}/video-ready`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setInviting(false)
    }
  }

  const backHref = role === 'host' ? '/admin/events' : `/sessions/${eventId}`

  return (
    <div className='mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-8'>
      <div className='space-y-1 text-center'>
        <p className='text-sm text-muted-foreground'>آماده‌سازی ورود</p>
        <h1 className='text-xl font-bold tracking-tight'>{eventTitle}</h1>
      </div>

      <div className='relative aspect-video overflow-hidden rounded-xl border bg-muted'>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className='size-full object-cover mirror'
        />
        {!camEnabled ? (
          <div className='absolute inset-0 flex items-center justify-center bg-muted'>
            <VideoOff className='size-10 text-muted-foreground' />
          </div>
        ) : null}
      </div>

      {deviceError ? (
        <p className='text-center text-sm text-amber-600 dark:text-amber-400'>
          {deviceError}
        </p>
      ) : null}

      <div className='flex justify-center gap-3'>
        <Button
          type='button'
          variant={micEnabled ? 'secondary' : 'destructive'}
          size='icon'
          onClick={() => setMicEnabled((v) => !v)}
        >
          {micEnabled ? <Mic className='size-4' /> : <MicOff className='size-4' />}
        </Button>
        <Button
          type='button'
          variant={camEnabled ? 'secondary' : 'destructive'}
          size='icon'
          onClick={() => setCamEnabled((v) => !v)}
        >
          {camEnabled ? <Video className='size-4' /> : <VideoOff className='size-4' />}
        </Button>
      </div>

      {state === 'too_early' ? (
        <p className='text-center text-sm text-muted-foreground'>
          ورود از {formatCountdown(msUntilOpen)} دیگر ممکن می‌شود.
        </p>
      ) : null}

      {state === 'ended' || state === 'cancelled' ? (
        <p className='text-center text-sm text-destructive'>
          {state === 'cancelled'
            ? 'این جلسه لغو شده است.'
            : 'پنجره ورود به این جلسه بسته شده است.'}
        </p>
      ) : null}

      <div className='flex flex-col gap-2'>
        <Button disabled={!canJoin} onClick={handleJoin}>
          ورود به جلسه
        </Button>
        {role === 'host' && canJoin ? (
          <Button
            variant='outline'
            disabled={inviting}
            onClick={() => void handleInviteClient()}
          >
            {inviting ? 'در حال ارسال…' : 'دعوت موکل به تماس'}
          </Button>
        ) : null}
        <Button variant='ghost' asChild>
          <Link href={backHref}>بازگشت</Link>
        </Button>
      </div>

      <style jsx global>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  )
}
