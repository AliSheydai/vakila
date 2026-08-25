'use client'

import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import type { Client } from '@/features/cases/types'

export type ClientsDialogType = 'create' | 'update' | 'delete'

type ClientsContextType = {
  open: ClientsDialogType | null
  setOpen: (value: ClientsDialogType | null) => void
  currentRow: Client | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Client | null>>
}

const ClientsContext = React.createContext<ClientsContextType | null>(null)

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ClientsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Client | null>(null)

  return (
    <ClientsContext.Provider
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </ClientsContext.Provider>
  )
}

export function useClientsDialogs() {
  const context = React.useContext(ClientsContext)
  if (!context) {
    throw new Error('useClientsDialogs باید داخل ClientsProvider استفاده شود.')
  }
  return context
}
