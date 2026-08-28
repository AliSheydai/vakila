'use client'

import { useEffect } from 'react'
import { useAuthStore, isLawyerRole } from '@/stores/auth-store'
import { useRealtimeSync } from '@/hooks/use-realtime'
import { useUnseenActivityStore } from '../stores/unseen-activity-store'

export function useUnseenActivityHydration(enabled = true) {
  const user = useAuthStore((state) => state.auth.user)
  const authHydrated = useAuthStore((state) => state.auth.hydrated)
  const hydrate = useUnseenActivityStore((state) => state.hydrate)
  const refresh = useUnseenActivityStore((state) => state.refresh)
  const hydrated = useUnseenActivityStore((state) => state.hydrated)
  const ownerId = useUnseenActivityStore((state) => state.ownerId)

  const resolvedUserId = enabled && user ? user.id : null
  const isLawyer = Boolean(user && isLawyerRole(user.role))

  useEffect(() => {
    if (!authHydrated || !resolvedUserId) return
    if (!hydrated || ownerId !== resolvedUserId) {
      void hydrate(resolvedUserId, isLawyer)
    }
  }, [authHydrated, hydrate, hydrated, isLawyer, ownerId, resolvedUserId])

  useRealtimeSync(
    (event) => {
      if (!resolvedUserId) return
      if (
        event.table === 'case_comments' ||
        event.table === 'attachments' ||
        event.table === 'notifications'
      ) {
        void refresh(isLawyer)
      }
    },
    Boolean(resolvedUserId)
  )

  return {
    hydrated: Boolean(authHydrated && hydrated && ownerId === resolvedUserId),
    userId: resolvedUserId,
  }
}

export function useClientUnseenTotal(clientId: string | null | undefined) {
  return useUnseenActivityStore((state) =>
    clientId ? state.getClientTotal(clientId) : 0
  )
}

export function useClientUnseenBreakdown(clientId: string | null | undefined) {
  return useUnseenActivityStore((state) =>
    clientId ? state.getClientBreakdown(clientId) : null
  )
}

export function useTotalClientUnseenActivity() {
  const hydrated = useUnseenActivityStore((state) => state.hydrated)
  const total = useUnseenActivityStore((state) => state.totalClientActivity)
  if (!hydrated) return 0
  return total
}

export function useCaseUnseenActivity(caseId: string | null | undefined) {
  return useUnseenActivityStore((state) =>
    caseId ? state.getCaseActivity(caseId) : null
  )
}

export function useTotalCaseContentActivity() {
  const hydrated = useUnseenActivityStore((state) => state.hydrated)
  const total = useUnseenActivityStore((state) => state.totalCaseContent)
  if (!hydrated) return 0
  return total
}

export function useCaseNotificationBadge(caseId: string) {
  return useUnseenActivityStore((state) => state.getCaseTotal(caseId))
}
