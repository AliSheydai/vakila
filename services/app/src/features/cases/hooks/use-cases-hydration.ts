'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useRealtimeSync } from '@/hooks/use-realtime'
import { useCasesStore } from '../stores/cases-store'

export function useCasesHydration() {
  const user = useAuthStore((state) => state.auth.user)
  const authHydrated = useAuthStore((state) => state.auth.hydrated)
  const hydrate = useCasesStore((state) => state.hydrate)
  const hydrated = useCasesStore((state) => state.hydrated)
  const ownerId = useCasesStore((state) => state.ownerId)

  const resolvedOwnerId = user?.id ?? null

  useEffect(() => {
    if (!authHydrated || !resolvedOwnerId) return
    if (!hydrated || ownerId !== resolvedOwnerId) {
      void hydrate(resolvedOwnerId)
    }
  }, [authHydrated, hydrate, hydrated, ownerId, resolvedOwnerId])

  useRealtimeSync((event) => {
    if (!resolvedOwnerId) return
    if (
      event.table === 'cases' ||
      event.table === 'clients' ||
      event.table === 'attachments' ||
      event.table === 'case_fees' ||
      event.table === 'case_payments' ||
      event.table === 'case_expenses'
    ) {
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
