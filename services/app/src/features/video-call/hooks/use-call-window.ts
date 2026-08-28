'use client'

import { useEffect, useState } from 'react'
import {
  JOIN_EARLY_MINUTES,
  JOIN_LATE_MINUTES,
  type CallWindowState,
} from '../types'

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

export function useCallWindow(input: {
  date: string
  startTime: string
  endTime: string
  status: string
}) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(timer)
  }, [])

  const state = getCallWindowState({ ...input, now })
  const start = parseEventDateTime(input.date, input.startTime)
  const windowStart = new Date(
    start.getTime() - JOIN_EARLY_MINUTES * 60_000
  )
  const msUntilOpen = Math.max(0, windowStart.getTime() - now.getTime())

  return {
    state,
    canJoin: state === 'ready' || state === 'in_progress',
    msUntilOpen,
  }
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours.toLocaleString('fa-IR')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes.toLocaleString('fa-IR')}:${String(seconds).padStart(2, '0')}`
}
