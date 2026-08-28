'use client'

import { useAuthStore, isLawyerRole } from '@/stores/auth-store'
import { useNotificationsHydration } from '@/features/notifications/hooks/use-notifications-hydration'
import { useUnseenActivityHydration } from '@/features/notifications/hooks/use-unseen-activity-hydration'

/** Mount once in authenticated layout to hydrate notification stores. */
export function NotificationsBootstrap() {
  const user = useAuthStore((state) => state.auth.user)
  const authHydrated = useAuthStore((state) => state.auth.hydrated)

  useNotificationsHydration(Boolean(authHydrated && user))
  useUnseenActivityHydration(Boolean(authHydrated && user))

  return null
}

export function useIsLawyerUser() {
  const user = useAuthStore((state) => state.auth.user)
  return Boolean(user && isLawyerRole(user.role))
}
