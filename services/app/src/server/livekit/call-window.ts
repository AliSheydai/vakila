import {
  JOIN_EARLY_MINUTES,
  JOIN_LATE_MINUTES,
  type CallWindowState,
} from '@/features/video-call/types'

function parseEventDateTime(date: string, time: string): Date {
  const normalized = time.length >= 5 ? time.slice(0, 5) : time
  return new Date(`${date}T${normalized}:00`)
}

export function getCallWindowState(input: {
  date: string
  startTime: string
  endTime: string
  status: string
  now?: Date
}): CallWindowState {
  if (input.status === 'cancelled') return 'cancelled'
  if (input.status === 'completed') return 'ended'

  const now = input.now ?? new Date()
  const start = parseEventDateTime(input.date, input.startTime)
  const end = parseEventDateTime(input.date, input.endTime)

  const windowStart = new Date(start.getTime() - JOIN_EARLY_MINUTES * 60_000)
  const windowEnd = new Date(end.getTime() + JOIN_LATE_MINUTES * 60_000)

  if (now < windowStart) return 'too_early'
  if (now > windowEnd) return 'ended'
  if (now >= start && now <= end) return 'in_progress'
  return 'ready'
}

export function isWithinCallWindow(input: {
  date: string
  startTime: string
  endTime: string
  status: string
  now?: Date
}): boolean {
  const state = getCallWindowState(input)
  return state === 'ready' || state === 'in_progress'
}

export function msUntilCallWindow(input: {
  date: string
  startTime: string
  now?: Date
}): number {
  const now = input.now ?? new Date()
  const start = parseEventDateTime(input.date, input.startTime)
  const windowStart = new Date(start.getTime() - JOIN_EARLY_MINUTES * 60_000)
  return Math.max(0, windowStart.getTime() - now.getTime())
}
