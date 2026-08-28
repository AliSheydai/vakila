'use client'

import { useEffect, useRef } from 'react'

export type RealtimeDbEvent = {
  type: 'db'
  table: string
  op: 'INSERT' | 'UPDATE' | 'DELETE'
  id: string
  row?: Record<string, unknown>
  ts?: string
}

type RealtimeMessage = RealtimeDbEvent | { type: string; [key: string]: unknown }

function wsUrl(): string {
  if (typeof window === 'undefined') return ''
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/api/ws`
}

/**
 * Same-origin WebSocket; cookies are sent automatically.
 * Calls `onEvent` for `type: 'db'` messages (e.g. to invalidate / re-fetch).
 */
export function useRealtimeSync(
  onEvent: (event: RealtimeDbEvent) => void,
  enabled = true
) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    let socket: WebSocket | null = null
    let closed = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let attempt = 0

    const connect = () => {
      if (closed) return
      const url = wsUrl()
      if (!url) return

      socket = new WebSocket(url)

      socket.onopen = () => {
        attempt = 0
      }

      socket.onmessage = (message) => {
        try {
          const data = JSON.parse(String(message.data)) as RealtimeMessage
          if (data?.type === 'db') {
            onEventRef.current(data as RealtimeDbEvent)
          }
        } catch {
          // ignore malformed payloads
        }
      }

      socket.onclose = () => {
        if (closed) return
        const delay = Math.min(30_000, 1000 * 2 ** attempt)
        attempt += 1
        retryTimer = setTimeout(connect, delay)
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    return () => {
      closed = true
      if (retryTimer) clearTimeout(retryTimer)
      socket?.close()
    }
  }, [enabled])
}
