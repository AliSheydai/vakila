import { create } from 'zustand'
import * as apiEvents from '../services/api-events-service'
import type {
  CreateEventInput,
  Event,
  EventFilters,
  EventSearchContext,
  UpdateEventInput,
} from '../types'
import {
  getEventsByCase,
  getEventsByClient,
  getEventsByDate,
  getPastEvents,
  getThisWeekEvents,
  getTodayEvents,
  getUpcomingEvents,
  summarizeEvents,
  type EventsSummary,
} from '../utils/filters'

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

type EventsState = {
  ownerId: string | null
  events: Event[]
  hydrated: boolean
  error: string | null

  hydrate: (ownerId: string) => Promise<ActionResult>
  reset: () => void

  addEvent: (input: CreateEventInput) => Promise<ActionResult<Event>>
  updateEvent: (
    eventId: string,
    input: UpdateEventInput
  ) => Promise<ActionResult<Event>>
  deleteEvent: (eventId: string) => Promise<ActionResult>
  getEvent: (eventId: string) => Event | null

  searchEvents: (query: string, context?: EventSearchContext) => Event[]
  filterEvents: (
    filters: EventFilters,
    context?: EventSearchContext
  ) => Event[]
  getEventsByDate: (date: string) => Event[]
  getEventsByCase: (caseId: string) => Event[]
  getEventsByClient: (clientId: string) => Event[]
  getTodayEvents: (now?: Date) => Event[]
  getThisWeekEvents: (now?: Date) => Event[]
  getUpcomingEvents: (now?: Date) => Event[]
  getPastEvents: (now?: Date) => Event[]
  getSummary: (now?: Date) => EventsSummary
}

export const useEventsStore = create<EventsState>((set, get) => ({
  ownerId: null,
  events: [],
  hydrated: false,
  error: null,

  hydrate: async (ownerId) => {
    const result = await apiEvents.listEvents()

    if (!result.ok) {
      set({
        ownerId,
        events: [],
        hydrated: true,
        error: result.error,
      })
      return { ok: false, error: result.error }
    }

    set({
      ownerId,
      events: result.data,
      hydrated: true,
      error: null,
    })

    return { ok: true, data: undefined }
  },

  reset: () => {
    set({
      ownerId: null,
      events: [],
      hydrated: false,
      error: null,
    })
  },

  addEvent: async (input) => {
    const result = await apiEvents.createEvent(input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    set({
      events: [result.data, ...get().events],
      error: null,
    })
    return result
  },

  updateEvent: async (eventId, input) => {
    const result = await apiEvents.updateEvent(eventId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    set({
      events: get().events.map((item) =>
        item.id === eventId ? result.data : item
      ),
      error: null,
    })
    return result
  },

  deleteEvent: async (eventId) => {
    const result = await apiEvents.deleteEvent(eventId)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    set({
      events: get().events.filter((item) => item.id !== eventId),
      error: null,
    })
    return { ok: true, data: undefined }
  },

  getEvent: (eventId) =>
    get().events.find((item) => item.id === eventId) ?? null,

  searchEvents: (query, context) =>
    apiEvents.searchEvents(get().events, query, context),

  filterEvents: (filters, context) =>
    apiEvents.queryEvents(get().events, filters, context),

  getEventsByDate: (date) => getEventsByDate(get().events, date),

  getEventsByCase: (caseId) => getEventsByCase(get().events, caseId),

  getEventsByClient: (clientId) =>
    getEventsByClient(get().events, clientId),

  getTodayEvents: (now) => getTodayEvents(get().events, now),

  getThisWeekEvents: (now) => getThisWeekEvents(get().events, now),

  getUpcomingEvents: (now) => getUpcomingEvents(get().events, now),

  getPastEvents: (now) => getPastEvents(get().events, now),

  getSummary: (now) => summarizeEvents(get().events, now),
}))
