'use client'

import { useMemo } from 'react'
import {
  isTrackReference,
  useTracks,
  type TrackReferenceOrPlaceholder,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import { cn } from '@/lib/utils'
import { CallParticipantTile } from './call-participant-tile'

function isActiveTrack(trackRef: TrackReferenceOrPlaceholder) {
  return (
    isTrackReference(trackRef) &&
    !trackRef.publication.isMuted &&
    Boolean(trackRef.publication.track)
  )
}

function shouldShowTrack(trackRef: TrackReferenceOrPlaceholder) {
  if (trackRef.participant.isLocal) return true
  try {
    const meta = trackRef.participant.metadata
      ? (JSON.parse(trackRef.participant.metadata) as { role?: string })
      : null
    if (meta?.role === 'client' && !trackRef.participant.permissions?.canPublish) {
      return false
    }
  } catch {
    /* ignore */
  }
  return true
}

export function CallVideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )

  const { screenTracks, cameraTracks } = useMemo(() => {
    const visible = tracks.filter(shouldShowTrack)
    return {
      screenTracks: visible.filter(
        (t) => t.source === Track.Source.ScreenShare && isActiveTrack(t)
      ),
      cameraTracks: visible.filter((t) => t.source === Track.Source.Camera),
    }
  }, [tracks])

  const hasScreenShare = screenTracks.length > 0

  if (hasScreenShare) {
    const primaryScreen = screenTracks[0]
    return (
      <div className='video-call-grid flex h-full min-h-0 flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row'>
        <div className='min-h-0 min-w-0 flex-1'>
          <CallParticipantTile
            trackRef={primaryScreen}
            isScreenShare
            mirrorLocal={false}
            className='h-full min-h-[min(50vh,480px)] lg:min-h-0'
          />
        </div>
        {cameraTracks.length > 0 ? (
          <div className='flex shrink-0 gap-2 overflow-x-auto pb-1 lg:w-52 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0'>
            {cameraTracks.map((trackRef) => (
              <CallParticipantTile
                key={`${trackRef.participant.identity}-${trackRef.source}`}
                trackRef={trackRef}
                compact
                className='aspect-video w-40 shrink-0 lg:w-full'
              />
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  const count = cameraTracks.length
  const isSolo = count <= 1
  const isDuo = count === 2

  return (
    <div
      className={cn(
        'video-call-grid grid h-full min-h-0 gap-3 p-3 sm:gap-4 sm:p-4',
        isSolo && 'grid-cols-1',
        isDuo && 'grid-cols-1 md:grid-cols-2',
        !isSolo && !isDuo && 'grid-cols-1 sm:grid-cols-2'
      )}
    >
      {cameraTracks.map((trackRef) => {
        const key = `${trackRef.participant.identity}-${trackRef.source}`
        const hasVideo = isActiveTrack(trackRef)

        return (
          <CallParticipantTile
            key={key}
            trackRef={trackRef}
            compact={!isSolo && !hasVideo}
            className={cn(
              'min-h-[220px]',
              isSolo && 'min-h-[min(72vh,640px)]',
              isDuo && 'min-h-[min(52vh,480px)] md:min-h-[min(68vh,560px)]'
            )}
          />
        )
      })}
    </div>
  )
}
