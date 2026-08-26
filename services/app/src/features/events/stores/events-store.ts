import { create } from 'zustand'
import * as casesService from '@/features/cases/services/cases-service'
import * as clientsService from '@/features/cases/services/clients-service'
import * as eventsService from '../services/events-service'
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
import { buildDemoEvents } from '../utils/seed'

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

type EventsState = {
  ownerId: string | null
  events: Event[]
  hydrated: boolean
  error: string | null

  hydrate: (ownerId: string, options?: { seedIfEmpty?: boolean }) => ActionResult
  seedDemoIfEmpty: () => ActionResult
  reset: () => void

  addEvent: (input: CreateEventInput) => ActionResult<Event>
  updateEvent: (eventId: string, input: UpdateEventInput) => ActionResult<Event>
  deleteEvent: (eventId: string) => ActionResult
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

function requireOwner(
  ownerId: string | null
): { ok: true; ownerId: string } | { ok: false; error: string } {
  if (!ownerId) {
    return { ok: false, error: 'کاربر مشخص نیست. ابتدا وارد شوید.' }
  }
  return { ok: true, ownerId }
}

function seedDemoData(ownerId: string): ActionResult<Event[]> {
  const casesResult = casesService.listCases(ownerId)
  const clientsResult = clientsService.listClients(ownerId)

  const cases = casesResult.ok ? casesResult.data : []
  const clients = clientsResult.ok ? clientsResult.data : []

  const events = buildDemoEvents(ownerId, { cases, clients })
  const saved = eventsService.replaceEvents(ownerId, events)
  if (!saved.ok) return saved

  return { ok: true, data: events }
}

export const useEventsStore = create<EventsState>((set, get) => ({
  ownerId: null,
  events: [],
  hydrated: false,
  error: null,

  hydrate: (ownerId, options) => {
    const seedIfEmpty = options?.seedIfEmpty ?? false
    const result = eventsService.listEvents(ownerId)

    if (!result.ok) {
      set({
        ownerId,
        events: [],
        hydrated: true,
        error: result.error,
      })
      return { ok: false, error: result.error }
    }

    let events = result.data

    if (seedIfEmpty && events.length === 0) {
      const seeded = seedDemoData(ownerId)
      if (seeded.ok) {
        events = seeded.data
      }
    }

    set({
      ownerId,
      events,
      hydrated: true,
      error: null,
    })

    return { ok: true, data: undefined }
  },

  seedDemoIfEmpty: () => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    if (get().events.length > 0) {
      return {
        ok: false,
        error:
          'داده‌ای از قبل وجود دارد؛ برای جلوگیری از بازنویسی seed انجام نشد.',
      }
    }

    const seeded = seedDemoData(gate.ownerId)
    if (!seeded.ok) {
      set({ error: seeded.error })
      return seeded
    }

    set({ events: seeded.data, error: null })
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

  addEvent: (input) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = eventsService.createEvent(gate.ownerId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    set({
      events: [...get().events, result.data],
      error: null,
    })
    return result
  },

  updateEvent: (eventId, input) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = eventsService.updateEvent(gate.ownerId, eventId, input)
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

  deleteEvent: (eventId) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = eventsService.deleteEvent(gate.ownerId, eventId)
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
    eventsService.searchEvents(get().events, query, context),

  filterEvents: (filters, context) =>
    eventsService.queryEvents(get().events, filters, context),

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
