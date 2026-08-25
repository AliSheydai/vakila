'use client'

import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import type { Case } from '../types'

export type CasesDialogType = 'create' | 'update' | 'delete'

type CasesContextType = {
  open: CasesDialogType | null
  setOpen: (value: CasesDialogType | null) => void
  currentRow: Case | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Case | null>>
}

const CasesContext = React.createContext<CasesContextType | null>(null)

export function CasesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<CasesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Case | null>(null)

  return (
    <CasesContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </CasesContext.Provider>
  )
}

export function useCasesDialogs() {
  const context = React.useContext(CasesContext)
  if (!context) {
    throw new Error('useCasesDialogs باید داخل CasesProvider استفاده شود.')
  }
  return context
}
