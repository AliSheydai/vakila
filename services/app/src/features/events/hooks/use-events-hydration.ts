'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useRealtimeSync } from '@/hooks/use-realtime'
import { useEventsStore } from '../stores/events-store'

export function useEventsHydration() {
  const user = useAuthStore((state) => state.auth.user)
  const authHydrated = useAuthStore((state) => state.auth.hydrated)
  const hydrate = useEventsStore((state) => state.hydrate)
  const hydrated = useEventsStore((state) => state.hydrated)
  const ownerId = useEventsStore((state) => state.ownerId)

  const resolvedOwnerId = user?.id ?? null

  useEffect(() => {
    if (!authHydrated || !resolvedOwnerId) return
    if (!hydrated || ownerId !== resolvedOwnerId) {
      void hydrate(resolvedOwnerId)
    }
  }, [authHydrated, hydrate, hydrated, ownerId, resolvedOwnerId])

  useRealtimeSync((event) => {
    if (!resolvedOwnerId) return
    if (event.table === 'events') {
      void hydrate(resolvedOwnerId)
    }
  }, Boolean(resolvedOwnerId))

  return {
    hydrated: Boolean(
      authHydrated && hydrated && ownerId === resolvedOwnerId
    ),
    ownerId: resolvedOwnerId,
  }
}
