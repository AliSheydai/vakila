import type { Participant } from 'livekit-client'
import type { VideoParticipantRole } from '../types'

export function getParticipantRole(
  participant: Participant
): VideoParticipantRole | null {
  try {
    const meta = participant.metadata
      ? (JSON.parse(participant.metadata) as { role?: VideoParticipantRole })
      : null
    return meta?.role ?? null
  } catch {
    return null
  }
}

export function getRoleLabel(role: VideoParticipantRole | null): string {
  if (role === 'host') return 'وکیل'
  if (role === 'client') return 'موکل'
  return 'شرکت‌کننده'
}

export function getDisplayName(participant: Participant): string {
  const name = participant.name?.trim()
  if (name) return name
  const role = getParticipantRole(participant)
  return getRoleLabel(role)
}
