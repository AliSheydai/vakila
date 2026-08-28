import { RoomServiceClient } from 'livekit-server-sdk'
import { getEnv } from '../env'
import { getLiveKitRoomName } from './token'

function getRoomService(): RoomServiceClient {
  const env = getEnv()
  const httpUrl = env.LIVEKIT_URL.replace(/^ws/, 'http')
  return new RoomServiceClient(httpUrl, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET)
}

export async function ensureRoom(eventId: string): Promise<void> {
  const client = getRoomService()
  const roomName = getLiveKitRoomName(eventId)
  try {
    await client.createRoom({
      name: roomName,
      emptyTimeout: 300,
      maxParticipants: 4,
    })
  } catch {
    // Room may already exist
  }
}

export async function admitParticipant(
  eventId: string,
  participantIdentity: string
): Promise<void> {
  const client = getRoomService()
  const roomName = getLiveKitRoomName(eventId)
  await client.updateParticipant(roomName, participantIdentity, undefined, {
    canPublish: true,
    canSubscribe: true,
  })
}

export async function removeParticipant(
  eventId: string,
  participantIdentity: string
): Promise<void> {
  const client = getRoomService()
  const roomName = getLiveKitRoomName(eventId)
  try {
    await client.removeParticipant(roomName, participantIdentity)
  } catch {
    // Participant may have already left
  }
}

export async function listWaitingParticipants(eventId: string): Promise<
  { identity: string; name: string }[]
> {
  const client = getRoomService()
  const roomName = getLiveKitRoomName(eventId)
  try {
    const participants = await client.listParticipants(roomName)
    return participants
      .filter((p) => {
        if (!p.metadata) return false
        try {
          const meta = JSON.parse(p.metadata) as { role?: string }
          return meta.role === 'client' && !p.tracks.some((t) => t.type === 1)
        } catch {
          return false
        }
      })
      .map((p) => ({
        identity: p.identity,
        name: p.name || p.identity,
      }))
  } catch {
    return []
  }
}
