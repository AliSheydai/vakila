'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useCasesStore } from '../stores/cases-store'

/** شناسه پایدار مالک برای Prototype — با accountNo ورود mock هم‌خوان است */
const FALLBACK_OWNER_ID = 'ACC001'

export function useCasesHydration() {
  const user = useAuthStore((state) => state.auth.user)
  const hydrate = useCasesStore((state) => state.hydrate)
  const hydrated = useCasesStore((state) => state.hydrated)
  const ownerId = useCasesStore((state) => state.ownerId)

  const resolvedOwnerId = user?.accountNo || FALLBACK_OWNER_ID

  useEffect(() => {
    if (!hydrated || ownerId !== resolvedOwnerId) {
      hydrate(resolvedOwnerId)
    }
  }, [hydrate, hydrated, ownerId, resolvedOwnerId])

  return {
    hydrated: hydrated && ownerId === resolvedOwnerId,
    ownerId: resolvedOwnerId,
  }
}
