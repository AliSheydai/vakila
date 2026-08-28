'use client'

import { useEffect } from 'react'
import { useAuthStore, isLawyerRole } from '@/stores/auth-store'
import { useRealtimeSync } from '@/hooks/use-realtime'
import { useConsultationRequestsStore } from '../stores/consultation-requests-store'

export function useConsultationRequestsHydration(enabled = true) {
  const user = useAuthStore((state) => state.auth.user)
  const authHydrated = useAuthStore((state) => state.auth.hydrated)
  const hydrate = useConsultationRequestsStore((state) => state.hydrate)
  const hydrated = useConsultationRequestsStore((state) => state.hydrated)
  const ownerId = useConsultationRequestsStore((state) => state.ownerId)

  const resolvedOwnerId =
    enabled && user && isLawyerRole(user.role) ? user.id : null

  useEffect(() => {
    if (!authHydrated || !resolvedOwnerId) return
    if (!hydrated || ownerId !== resolvedOwnerId) {
      void hydrate(resolvedOwnerId)
    }
  }, [authHydrated, hydrate, hydrated, ownerId, resolvedOwnerId])

  useRealtimeSync((event) => {
    if (!resolvedOwnerId) return
    if (event.table === 'consultation_requests') {
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

export function useConsultationRequestsBadge() {
  const user = useAuthStore((state) => state.auth.user)
  const authHydrated = useAuthStore((state) => state.auth.hydrated)
  const newCount = useConsultationRequestsStore((state) => state.newCount)
  const { hydrated } = useConsultationRequestsHydration(
    Boolean(user && isLawyerRole(user.role))
  )

  if (!authHydrated || !user || !isLawyerRole(user.role) || !hydrated) {
    return 0
  }

  return newCount
}
