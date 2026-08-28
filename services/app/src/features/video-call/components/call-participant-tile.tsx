'use client'

import {
  isTrackReference,
  useIsSpeaking,
  VideoTrack,
  type TrackReferenceOrPlaceholder,
} from '@livekit/components-react'
import { MicOff, MonitorUp, User } from 'lucide-react'
import { Track } from 'livekit-client'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  getDisplayName,
  getParticipantRole,
  getRoleLabel,
} from '../utils/participant'

type CallParticipantTileProps = {
  trackRef: TrackReferenceOrPlaceholder
  className?: string
  compact?: boolean
  mirrorLocal?: boolean
  isScreenShare?: boolean
}

export function CallParticipantTile({
  trackRef,
  className,
  compact = false,
  mirrorLocal = true,
  isScreenShare = false,
}: CallParticipantTileProps) {
  const participant = trackRef.participant
  const isSpeaking = useIsSpeaking(participant)
  const micMuted = participant.isMicrophoneEnabled === false
  const hasVideo =
    isTrackReference(trackRef) &&
    !trackRef.publication.isMuted &&
    Boolean(trackRef.publication.track)
  const isLocal = participant.isLocal
  const role = getParticipantRole(participant)
  const name = getDisplayName(participant)
  const roleLabel = getRoleLabel(role)
  const shouldMirror =
    mirrorLocal && isLocal && trackRef.source !== Track.Source.ScreenShare

  return (
    <div
      className={cn(
        'video-call-tile relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1a22]',
        isSpeaking && 'ring-2 ring-primary ring-offset-2 ring-offset-[#06141c]',
        className
      )}
    >
      {hasVideo && isTrackReference(trackRef) ? (
        <VideoTrack
          trackRef={trackRef}
          className={cn(
            'size-full',
            isScreenShare ? 'object-contain bg-black' : 'object-cover',
            shouldMirror && 'scale-x-[-1]'
          )}
        />
      ) : (
        <div className='flex size-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#0e2c38] to-[#06141c]'>
          <div
            className={cn(
              'flex items-center justify-center rounded-full bg-primary/20 text-primary',
              compact ? 'size-12' : 'size-20'
            )}
          >
            <User className={compact ? 'size-6' : 'size-10'} />
          </div>
          {!compact ? (
            <p className='text-sm font-medium text-white/90'>{name}</p>
          ) : null}
        </div>
      )}

      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent',
          compact ? 'px-2 pb-2 pt-6' : 'px-3 pb-3 pt-10'
        )}
      >
        <div className='flex items-center gap-2'>
          <div className='min-w-0 flex-1'>
            <p
              className={cn(
                'truncate font-medium text-white',
                compact ? 'text-xs' : 'text-sm'
              )}
            >
              {isScreenShare ? (
                <span className='inline-flex items-center gap-1.5'>
                  <MonitorUp className='size-3.5 shrink-0' />
                  {isLocal ? 'اشتراک صفحه شما' : `اشتراک صفحه ${name}`}
                </span>
              ) : (
                <>
                  {name}
                  {isLocal ? ' (شما)' : ''}
                </>
              )}
            </p>
            {!compact ? (
              <p className='text-[11px] text-white/70'>{roleLabel}</p>
            ) : null}
          </div>
          {compact ? (
            <Badge
              variant='secondary'
              className='border-0 bg-black/40 text-[10px] text-white'
            >
              {roleLabel}
            </Badge>
          ) : null}
          {micMuted ? (
            <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive/90 text-white'>
              <MicOff className='size-3.5' />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
