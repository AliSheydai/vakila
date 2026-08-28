'use client'

import { useEffect, useRef } from 'react'
import { subscribeRealtime, type RealtimeDbEvent } from '@/hooks/realtime-hub'

export type { RealtimeDbEvent }

/**
 * Subscribes to the shared realtime WebSocket (one connection per app).
 */
export function useRealtimeSync(
  onEvent: (event: RealtimeDbEvent) => void,
  enabled = true
) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    return subscribeRealtime((event) => {
      onEventRef.current(event)
    })
  }, [enabled])
}
