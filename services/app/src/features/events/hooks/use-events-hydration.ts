'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useEventsStore } from '../stores/events-store'

/** شناسه پایدار مالک برای Prototype — با accountNo ورود mock هم‌خوان است */
const FALLBACK_OWNER_ID = 'ACC001'

export function useEventsHydration(options?: { seedIfEmpty?: boolean }) {
  const user = useAuthStore((state) => state.auth.user)
  const hydrate = useEventsStore((state) => state.hydrate)
  const hydrated = useEventsStore((state) => state.hydrated)
  const ownerId = useEventsStore((state) => state.ownerId)

  const resolvedOwnerId = user?.accountNo || FALLBACK_OWNER_ID
  const seedIfEmpty = options?.seedIfEmpty ?? true

  useEffect(() => {
    if (!hydrated || ownerId !== resolvedOwnerId) {
      hydrate(resolvedOwnerId, { seedIfEmpty })
    }
  }, [hydrate, hydrated, ownerId, resolvedOwnerId, seedIfEmpty])

  return {
    hydrated: hydrated && ownerId === resolvedOwnerId,
    ownerId: resolvedOwnerId,
  }
}
