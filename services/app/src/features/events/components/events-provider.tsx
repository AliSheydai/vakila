'use client'

import React, { useCallback, useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import type { Event } from '../types'
import type { EventsCalendarMode, EventsSurface } from '../types/ui'
import { toDateKey } from '../utils/datetime'

export type EventsDialogType = 'create' | 'update' | 'delete' | 'detail'

export type EventCreateDefaults = {
  date?: string
  startTime?: string
  endTime?: string
}

type EventsContextType = {
  open: EventsDialogType | null
  setOpen: (value: EventsDialogType | null) => void
  currentRow: Event | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Event | null>>
  createDefaults: EventCreateDefaults | null
  setCreateDefaults: React.Dispatch<
    React.SetStateAction<EventCreateDefaults | null>
  >
  openCreate: (defaults?: EventCreateDefaults) => void
  openDetail: (event: Event) => void
  openEdit: (event: Event) => void
  openDelete: (event: Event) => void
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
  const [createDefaults, setCreateDefaults] =
    useState<EventCreateDefaults | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()))
  const [surface, setSurface] = useState<EventsSurface>('calendar')
  const [calendarMode, setCalendarMode] =
    useState<EventsCalendarMode>('month')
  const [anchorDate, setAnchorDate] = useState(() => new Date())

  const openCreate = useCallback(
    (defaults?: EventCreateDefaults) => {
      setCurrentRow(null)
      setCreateDefaults(
        defaults ?? {
          date: selectedDate,
          startTime: '10:00',
          endTime: '11:00',
        }
      )
      setOpen('create')
    },
    [selectedDate, setOpen]
  )

  const openDetail = useCallback(
    (event: Event) => {
      setCurrentRow(event)
      setOpen('detail')
    },
    [setOpen]
  )

  const openEdit = useCallback(
    (event: Event) => {
      setCurrentRow(event)
      setOpen('update')
    },
    [setOpen]
  )

  const openDelete = useCallback(
    (event: Event) => {
      setCurrentRow(event)
      setOpen('delete')
    },
    [setOpen]
  )

  return (
    <EventsContext.Provider
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        createDefaults,
        setCreateDefaults,
        openCreate,
        openDetail,
        openEdit,
        openDelete,
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
