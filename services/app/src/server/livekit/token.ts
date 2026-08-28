import { AccessToken, type VideoGrant } from 'livekit-server-sdk'
import { getEnv } from '../env'
import type { VideoParticipantRole } from '@/features/video-call/types'

export function getLiveKitRoomName(eventId: string): string {
  return `event_${eventId}`
}

export function getCallPath(eventId: string): string {
  return `/call/${eventId}`
}

export function getLobbyPath(eventId: string): string {
  return `/call/${eventId}/lobby`
}

export function buildMeetingUrl(eventId: string): string {
  const { APP_URL } = getEnv()
  return `${APP_URL.replace(/\/$/, '')}${getLobbyPath(eventId)}`
}

export async function createVideoToken(params: {
  eventId: string
  userId: string
  displayName: string
  role: VideoParticipantRole
  canPublish: boolean
  ttlSeconds?: number
}): Promise<string> {
  const env = getEnv()
  const roomName = getLiveKitRoomName(params.eventId)

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: params.canPublish,
    canSubscribe: true,
    canPublishData: true,
  }

  if (params.role === 'host') {
    grant.roomAdmin = true
  }

  const token = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: params.userId,
    name: params.displayName,
    ttl: params.ttlSeconds ?? 4 * 60 * 60,
    metadata: JSON.stringify({
      role: params.role,
      eventId: params.eventId,
    }),
  })

  token.addGrant(grant)
  return await token.toJwt()
}

export function getLiveKitPublicUrl(): string {
  return getEnv().LIVEKIT_PUBLIC_URL
}
