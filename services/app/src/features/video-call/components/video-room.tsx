'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
  useLocalParticipant,
  useLocalParticipantPermissions,
  useRoomContext,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { PhoneOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { VideoTokenResponse } from '../types'
import { WaitingRoomPanel } from './waiting-room-panel'
import { RecordingConsentBar } from './recording-consent-bar'

type VideoRoomProps = {
  eventId: string
  tokenData: VideoTokenResponse
}

function CallShell({
  eventId,
  role,
  eventTitle,
}: {
  eventId: string
  role: VideoTokenResponse['role']
  eventTitle: string
}) {
  const router = useRouter()
  const room = useRoomContext()
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } =
    useLocalParticipant()
  const permissions = useLocalParticipantPermissions()
  const [completeOpen, setCompleteOpen] = useState(false)
  const canPublish = permissions?.canPublish ?? false
  const isWaitingClient = role === 'client' && !canPublish

  useEffect(() => {
    if (role !== 'client' || !canPublish) return
    void localParticipant.setMicrophoneEnabled(true)
    void localParticipant.setCameraEnabled(true)
  }, [canPublish, localParticipant, role])

  const remoteCount = room.numParticipants - 1

  const handleLeave = useCallback(async () => {
    await room.disconnect()
    if (role === 'host' && remoteCount <= 0) {
      setCompleteOpen(true)
      return
    }
    router.push(role === 'host' ? '/admin/events' : `/sessions/${eventId}`)
  }, [eventId, remoteCount, role, room, router])

  const markCompleted = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/complete`, {
        method: 'POST',
        credentials: 'include',
      })
      const json = (await res.json()) as { ok: boolean }
      if (json.ok) toast.success('جلسه به‌عنوان انجام‌شده ثبت شد.')
    } catch {
      toast.error('ثبت وضعیت جلسه ناموفق بود.')
    }
    router.push('/admin/events')
  }

  if (isWaitingClient) {
    return (
      <div className='flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center'>
        <div className='size-12 animate-pulse rounded-full bg-primary/20' />
        <h1 className='text-lg font-semibold'>در انتظار پذیرش وکیل</h1>
        <p className='max-w-sm text-sm text-muted-foreground'>
          وکیل به‌زودی شما را به جلسه «{eventTitle}» راه می‌دهد. لطفاً این صفحه را باز نگه دارید.
        </p>
        <Button variant='outline' onClick={() => void handleLeave()}>
          انصراف
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className='flex h-dvh flex-col bg-background'>
        <header className='flex shrink-0 items-center justify-between border-b px-4 py-3'>
          <div>
            <p className='text-xs text-muted-foreground'>تماس تصویری</p>
            <h1 className='font-semibold tracking-tight'>{eventTitle}</h1>
          </div>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            {!isMicrophoneEnabled || !isCameraEnabled ? (
              <span>صدا/تصویر محدود</span>
            ) : null}
            <Button variant='destructive' size='sm' onClick={() => void handleLeave()}>
              <PhoneOff className='size-4' />
              خروج
            </Button>
          </div>
        </header>

        {role === 'host' ? <WaitingRoomPanel eventId={eventId} /> : null}
        <RecordingConsentBar eventId={eventId} role={role} />

        <div className='video-call-room min-h-0 flex-1 overflow-hidden [&_.lk-video-conference]:h-full'>
          <VideoConference />
        </div>
      </div>

      <AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>پایان جلسه</AlertDialogTitle>
            <AlertDialogDescription>
              آیا این جلسه به‌طور کامل برگزار شد و می‌خواهید وضعیت آن را «انجام‌شده» ثبت کنید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant='outline' onClick={() => router.push('/admin/events')}>
                فقط خروج
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => void markCompleted()}>
              ثبت انجام‌شده
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function VideoRoom({ eventId, tokenData }: VideoRoomProps) {
  const router = useRouter()

  return (
    <LiveKitRoom
      token={tokenData.token}
      serverUrl={tokenData.livekitUrl}
      connect
      audio={tokenData.canPublish}
      video={tokenData.canPublish}
      onDisconnected={() => {
        router.push(
          tokenData.role === 'host'
            ? '/admin/events'
            : `/sessions/${eventId}`
        )
      }}
      data-lk-theme='default'
      className='h-dvh'
    >
      <RoomAudioRenderer />
      <CallShell
        eventId={eventId}
        role={tokenData.role}
        eventTitle={tokenData.eventTitle}
      />
    </LiveKitRoom>
  )
}
