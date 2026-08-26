'use client'

import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import type { Event } from '../types'
import type { EventsCalendarMode, EventsSurface } from '../types/ui'
import { toDateKey } from '../utils/datetime'

export type EventsDialogType = 'create' | 'update' | 'delete' | 'detail'

type EventsContextType = {
  open: EventsDialogType | null
  setOpen: (value: EventsDialogType | null) => void
  currentRow: Event | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Event | null>>
  selectedDate: string
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>
  surface: EventsSurface
  setSurface: React.Dispatch<React.SetStateAction<EventsSurface>>
  calendarMode: EventsCalendarMode
  setCalendarMode: React.Dispatch<React.SetStateAction<EventsCalendarMode>>
  anchorDate: Date
  setAnchorDate: React.Dispatch<React.SetStateAction<Date>>
}

const EventsContext = React.createContext<EventsContextType | null>(null)

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<EventsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Event | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [surface, setSurface] = useState<EventsSurface>('calendar')
  const [calendarMode, setCalendarMode] =
    useState<EventsCalendarMode>('month')
  const [anchorDate, setAnchorDate] = useState(() => new Date())

  return (
    <EventsContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        selectedDate,
        setSelectedDate,
        surface,
        setSurface,
        calendarMode,
        setCalendarMode,
        anchorDate,
        setAnchorDate,
      }}
    >
      {children}
    </EventsContext.Provider>
  )
}

export function useEventsUi() {
  const context = React.useContext(EventsContext)
  if (!context) {
    throw new Error('useEventsUi باید داخل EventsProvider استفاده شود.')
  }
  return context
}
