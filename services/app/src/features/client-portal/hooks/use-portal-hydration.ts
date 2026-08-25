'use client'

import { useEffect } from 'react'
import { usePortalStore } from '../stores/portal-store'
import { DEMO_CLIENT_ID } from '../utils/seed'

/**
 * تا زمان اتصال API واقعی، دادهٔ پنل موکل با شناسه پایدار نمونه hydrate می‌شود.
 */
export function usePortalHydration() {
  const hydrate = usePortalStore((state) => state.hydrate)
  const hydrated = usePortalStore((state) => state.hydrated)
  const clientId = usePortalStore((state) => state.clientId)

  useEffect(() => {
    if (!hydrated || clientId !== DEMO_CLIENT_ID) {
      hydrate(DEMO_CLIENT_ID)
    }
  }, [hydrate, hydrated, clientId])

  return {
    hydrated: hydrated && clientId === DEMO_CLIENT_ID,
    clientId: DEMO_CLIENT_ID,
  }
}
