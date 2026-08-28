'use client'



import { useCallback, useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import {

  LiveKitRoom,

  RoomAudioRenderer,

  useLocalParticipant,

  useLocalParticipantPermissions,

  useRoomContext,

} from '@livekit/components-react'

import { Loader2 } from 'lucide-react'

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
import {
  consumeCallMediaPrefs,
  DEFAULT_CALL_MEDIA_PREFS,
  type CallMediaPrefs,
} from '../utils/call-prefs'

import { WaitingRoomPanel } from './waiting-room-panel'

import { RecordingConsentBar } from './recording-consent-bar'

import { CallHeader } from './call-header'

import { CallVideoGrid } from './call-video-grid'

import { CallControlBar } from './call-control-bar'



type VideoRoomProps = {

  eventId: string

  tokenData: VideoTokenResponse

}



function CallShell({

  eventId,

  role,

  eventTitle,

  mediaPrefs,

  onNavigateAway,

}: {

  eventId: string

  role: VideoTokenResponse['role']

  eventTitle: string

  mediaPrefs: CallMediaPrefs

  onNavigateAway: () => void

}) {

  const room = useRoomContext()

  const { localParticipant } = useLocalParticipant()

  const permissions = useLocalParticipantPermissions()

  const [completeOpen, setCompleteOpen] = useState(false)

  const canPublish = permissions?.canPublish ?? false

  const isWaitingClient = role === 'client' && !canPublish



  useEffect(() => {

    if (!canPublish) return

    void localParticipant.setMicrophoneEnabled(mediaPrefs.mic)

    void localParticipant.setCameraEnabled(mediaPrefs.cam)

  }, [canPublish, localParticipant, mediaPrefs.cam, mediaPrefs.mic])



  const remoteCount = room.numParticipants - 1



  const handleLeave = useCallback(async () => {

    await room.disconnect()

    if (role === 'host' && remoteCount <= 0) {

      setCompleteOpen(true)

      return

    }

    onNavigateAway()

  }, [onNavigateAway, remoteCount, role, room])



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

    onNavigateAway()

  }



  if (isWaitingClient) {

    return (

      <div className='video-call-page flex h-dvh flex-col items-center justify-center gap-5 px-6 text-center'>

        <div className='relative flex size-20 items-center justify-center rounded-full border border-primary/20 bg-primary/10'>

          <Loader2 className='size-9 animate-spin text-primary' />

        </div>

        <div className='max-w-md space-y-2'>

          <h1 className='text-xl font-semibold'>در انتظار پذیرش وکیل</h1>

          <p className='text-sm leading-7 text-muted-foreground'>

            وکیل به‌زودی شما را به جلسه «{eventTitle}» راه می‌دهد. لطفاً این

            صفحه را باز نگه دارید.

          </p>

        </div>

        <Button variant='outline' onClick={() => void handleLeave()}>

          انصراف و خروج

        </Button>

      </div>

    )

  }



  return (

    <>

      <div className='video-call-page flex h-dvh flex-col bg-background font-sans'>

        <CallHeader

          eventTitle={eventTitle}

          participantCount={room.numParticipants}

          role={role}

        />



        {role === 'host' ? <WaitingRoomPanel eventId={eventId} /> : null}

        <RecordingConsentBar eventId={eventId} role={role} />



        <div className='video-call-stage relative min-h-0 flex-1 overflow-hidden'>

          <div className='video-call-stage-glow pointer-events-none absolute inset-0' />

          <CallVideoGrid />

        </div>



        <CallControlBar onLeave={() => void handleLeave()} />

      </div>



      <AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>

        <AlertDialogContent dir='rtl' className='font-sans'>

          <AlertDialogHeader>

            <AlertDialogTitle>پایان جلسه</AlertDialogTitle>

            <AlertDialogDescription>

              آیا این جلسه به‌طور کامل برگزار شد و می‌خواهید وضعیت آن را

              «انجام‌شده» ثبت کنید؟

            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter className='gap-2 sm:gap-2'>

            <AlertDialogCancel asChild>

              <Button variant='outline' onClick={onNavigateAway}>

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

  const navigatedRef = useRef(false)

  const [mediaPrefs] = useState(

    () => consumeCallMediaPrefs(eventId) ?? DEFAULT_CALL_MEDIA_PREFS

  )



  const onNavigateAway = useCallback(() => {

    if (navigatedRef.current) return

    navigatedRef.current = true

    router.push(

      tokenData.role === 'host'

        ? '/admin/events'

        : `/sessions/${eventId}`

    )

  }, [eventId, router, tokenData.role])



  const initialAudio = tokenData.canPublish ? mediaPrefs.mic : false

  const initialVideo = tokenData.canPublish ? mediaPrefs.cam : false



  return (

    <LiveKitRoom

      token={tokenData.token}

      serverUrl={tokenData.livekitUrl}

      connect

      audio={initialAudio}

      video={initialVideo}

      onDisconnected={onNavigateAway}

      className='video-call-page h-dvh font-sans'

    >

      <RoomAudioRenderer />

      <CallShell

        eventId={eventId}

        role={tokenData.role}

        eventTitle={tokenData.eventTitle}

        mediaPrefs={mediaPrefs}

        onNavigateAway={onNavigateAway}

      />

    </LiveKitRoom>

  )

}

