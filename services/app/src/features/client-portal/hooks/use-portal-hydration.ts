'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useRealtimeSync } from '@/hooks/use-realtime'
import { usePortalStore } from '../stores/portal-store'

export function usePortalHydration() {
  const user = useAuthStore((state) => state.auth.user)
  const authHydrated = useAuthStore((state) => state.auth.hydrated)
  const hydrate = usePortalStore((state) => state.hydrate)
  const hydrated = usePortalStore((state) => state.hydrated)
  const clientId = usePortalStore((state) => state.clientId)

  const resolvedClientId = user?.id ?? null

  useEffect(() => {
    if (!authHydrated || !resolvedClientId) return
    if (!hydrated || clientId !== resolvedClientId) {
      void hydrate(resolvedClientId)
    }
  }, [authHydrated, hydrate, hydrated, clientId, resolvedClientId])

  useRealtimeSync((event) => {
    if (!resolvedClientId) return
    if (
      event.table === 'cases' ||
      event.table === 'events' ||
      event.table === 'case_payments' ||
      event.table === 'case_comments' ||
      event.table === 'attachments'
    ) {
      void hydrate(resolvedClientId)
    }
  }, Boolean(resolvedClientId))

  return {
    hydrated: Boolean(
      authHydrated && hydrated && clientId === resolvedClientId
    ),
    clientId: resolvedClientId,
  }
}
