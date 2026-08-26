'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type RequestIntent = 'consultation' | 'case' | 'documents'

type LandingActionsContextValue = {
  openRequest: (intent: RequestIntent) => void
  closeRequest: () => void
  intent: RequestIntent | null
  open: boolean
}

const LandingActionsContext = createContext<LandingActionsContextValue | null>(
  null
)

export function LandingActionsProvider({ children }: { children: ReactNode }) {
  const [intent, setIntent] = useState<RequestIntent | null>(null)
  const [open, setOpen] = useState(false)

  const openRequest = useCallback((next: RequestIntent) => {
    setIntent(next)
    setOpen(true)
  }, [])

  const closeRequest = useCallback(() => {
    setOpen(false)
  }, [])

  const value = useMemo(
    () => ({ openRequest, closeRequest, intent, open }),
    [openRequest, closeRequest, intent, open]
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
