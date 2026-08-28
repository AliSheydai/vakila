'use client'

import { useEffect } from 'react'
import { useAuthStore, isLawyerRole } from '@/stores/auth-store'
import { useRealtimeSync } from '@/hooks/use-realtime'
import { useNotificationsStore } from '../stores/notifications-store'
import { useUnseenActivityStore } from '../stores/unseen-activity-store'

export function useNotificationsHydration(enabled = true) {
  const user = useAuthStore((state) => state.auth.user)
  const authHydrated = useAuthStore((state) => state.auth.hydrated)
  const hydrate = useNotificationsStore((state) => state.hydrate)
  const refreshUnreadCount = useNotificationsStore(
    (state) => state.refreshUnreadCount
  )
  const refreshUnseen = useUnseenActivityStore((state) => state.refresh)
  const hydrated = useNotificationsStore((state) => state.hydrated)
  const userId = useNotificationsStore((state) => state.userId)

  const resolvedUserId = enabled && user ? user.id : null
  const isLawyer = Boolean(user && isLawyerRole(user.role))

  useEffect(() => {
    if (!authHydrated || !resolvedUserId) return
    if (!hydrated || userId !== resolvedUserId) {
      void hydrate(resolvedUserId)
    }
  }, [authHydrated, hydrate, hydrated, resolvedUserId, userId])

  useRealtimeSync(
    (event) => {
      if (!resolvedUserId) return
      if (event.table === 'notifications') {
        void refreshUnreadCount()
        void refreshUnseen(isLawyer)
      }
    },
    Boolean(resolvedUserId)
  )

  return {
    hydrated: Boolean(authHydrated && hydrated && userId === resolvedUserId),
    userId: resolvedUserId,
  }
}

export function useNotificationsBadge() {
  const user = useAuthStore((state) => state.auth.user)
  const authHydrated = useAuthStore((state) => state.auth.hydrated)
  const unreadCount = useNotificationsStore((state) => state.unreadCount)
  const hydrated = useNotificationsStore((state) => state.hydrated)

  if (!authHydrated || !user || !hydrated) {
    return 0
  }

  return unreadCount
}
