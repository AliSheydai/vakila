'use client'

import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/stores/auth-store'

type AuthBootstrapProps = {
  children: ReactNode
}

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const hydrateFromServer = useAuthStore((s) => s.auth.hydrateFromServer)
  const hydrated = useAuthStore((s) => s.auth.hydrated)

  useEffect(() => {
    if (!hydrated) {
      void hydrateFromServer()
    }
  }, [hydrateFromServer, hydrated])

  return <>{children}</>
}
