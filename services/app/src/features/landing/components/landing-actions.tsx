'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  isLawyerRole,
  useAuthStore,
} from '@/stores/auth-store'

export type RequestIntent = 'consultation' | 'case' | 'documents'

type LandingActionsContextValue = {
  openRequest: (intent: RequestIntent) => void
  startCaseIntake: () => void
  closeRequest: () => void
  intent: RequestIntent | null
  open: boolean
}

const LandingActionsContext = createContext<LandingActionsContextValue | null>(
  null
)

export function LandingActionsProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [intent, setIntent] = useState<RequestIntent | null>(null)
  const [open, setOpen] = useState(false)

  const openRequest = useCallback((next: RequestIntent) => {
    setIntent(next)
    setOpen(true)
  }, [])

  const closeRequest = useCallback(() => {
    setOpen(false)
  }, [])

  const startCaseIntake = useCallback(() => {
    const { user, hydrated } = useAuthStore.getState().auth

    // Before auth hydrates, go to /cases directly — middleware sends guests to
    // sign-in?next=/cases without losing the destination.
    if (!hydrated) {
      router.push('/cases')
      return
    }

    if (!user) {
      router.push('/sign-in?next=/cases')
      return
    }

    if (isLawyerRole(user.role)) {
      router.push('/admin/cases')
      return
    }

    router.push('/cases')
  }, [router])

  const value = useMemo(
    () => ({ openRequest, startCaseIntake, closeRequest, intent, open }),
    [openRequest, startCaseIntake, closeRequest, intent, open]
  )

  return (
    <LandingActionsContext.Provider value={value}>
      {children}
    </LandingActionsContext.Provider>
  )
}

export function useLandingActions() {
  const ctx = useContext(LandingActionsContext)
  if (!ctx) {
    throw new Error('useLandingActions must be used within LandingActionsProvider')
  }
  return ctx
}
