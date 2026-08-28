export const CALL_STATUSES = [
  'idle',
  'lobby',
  'waiting',
  'in_call',
  'ended',
] as const

export type CallStatus = (typeof CALL_STATUSES)[number]

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  idle: 'غیرفعال',
  lobby: 'آماده ورود',
  waiting: 'موکل در انتظار',
  in_call: 'در تماس',
  ended: 'پایان یافته',
}

export type VideoParticipantRole = 'host' | 'client'

export type VideoTokenResponse = {
  token: string
  roomName: string
  livekitUrl: string
  role: VideoParticipantRole
  canPublish: boolean
  eventTitle: string
  displayName: string
}

export type CallWindowState =
  | 'too_early'
  | 'ready'
  | 'in_progress'
  | 'ended'
  | 'cancelled'

export const JOIN_EARLY_MINUTES = 15
export const JOIN_LATE_MINUTES = 30
