import { readJson, writeJson } from '@/features/cases/services/storage'
import {
  eventsCollectionSchema,
  type CreateEventInput,
  type Event,
  type EventFilters,
  type EventSearchContext,
  type UpdateEventInput,
} from '../types'
import { createId, nowIso } from '../utils/id'
import {
  filterEvents,
  getEventsByCase,
  getEventsByClient,
  getEventsByDate,
} from '../utils/filters'
import { getEventEnd, getEventStart } from '../utils/datetime'

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function persist(ownerId: string, events: Event[]): ServiceResult<Event[]> {
  const result = writeJson(ownerId, 'events', events)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: events }
}

function touch(event: Event): Event {
  return { ...event, updatedAt: nowIso() }
}

function validateTimeRange(
  date: string,
  startTime: string,
  endTime: string
): ServiceResult<true> {
  const start = getEventStart({ date, startTime })
  const end = getEventEnd({ date, endTime })

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, error: 'تاریخ یا ساعت نامعتبر است.' }
  }

  if (end.getTime() <= start.getTime()) {
    return {
      ok: false,
      error: 'ساعت پایان باید بعد از ساعت شروع باشد.',
    }
  }

  return { ok: true, data: true }
}

function normalizeOptionalId(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function listEvents(ownerId: string): ServiceResult<Event[]> {
  const raw = readJson<unknown>(ownerId, 'events', [])

  if (!raw.ok) {
    return { ok: false, error: raw.error }
  }

  if (raw.empty) {
    return { ok: true, data: [] }
  }

  const parsed = eventsCollectionSchema.safeParse(raw.data)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'ساختار داده‌های رویدادها نامعتبر است.',
    }
  }

  return { ok: true, data: parsed.data }
}

export function getEvent(
  ownerId: string,
  eventId: string
): ServiceResult<Event | null> {
  const list = listEvents(ownerId)
  if (!list.ok) return list
  return {
    ok: true,
    data: list.data.find((item) => item.id === eventId) ?? null,
  }
}

export function createEvent(
  ownerId: string,
  input: CreateEventInput
): ServiceResult<Event> {
  const title = input.title.trim()
  if (!title) {
    return { ok: false, error: 'عنوان رویداد الزامی است.' }
  }

  if (!input.type) {
    return { ok: false, error: 'نوع رویداد الزامی است.' }
  }

  if (!input.date?.trim()) {
    return { ok: false, error: 'تاریخ رویداد الزامی است.' }
  }

  if (!input.startTime?.trim()) {
    return { ok: false, error: 'ساعت شروع الزامی است.' }
  }

  if (!input.endTime?.trim()) {
    return { ok: false, error: 'ساعت پایان الزامی است.' }
  }

  const range = validateTimeRange(input.date, input.startTime, input.endTime)
  if (!range.ok) return range

  const list = listEvents(ownerId)
  if (!list.ok) return list

  const timestamp = nowIso()
  const event: Event = {
    id: createId('event'),
    title,
    type: input.type,
    date: input.date.trim(),
    startTime: input.startTime.trim(),
    endTime: input.endTime.trim(),
    location: input.location?.trim() ?? '',
    description: input.description?.trim() ?? '',
    clientId: normalizeOptionalId(input.clientId),
    caseId: normalizeOptionalId(input.caseId),
    status: input.status ?? 'scheduled',
    ownerId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const parsed = eventsCollectionSchema.safeParse([...list.data, event])
  if (!parsed.success) {
    return { ok: false, error: 'داده‌های رویداد نامعتبر است.' }
  }

  const saved = persist(ownerId, parsed.data)
  if (!saved.ok) return saved

  return { ok: true, data: event }
}

export function updateEvent(
  ownerId: string,
  eventId: string,
  input: UpdateEventInput
): ServiceResult<Event> {
  const list = listEvents(ownerId)
  if (!list.ok) return list

  const index = list.data.findIndex((item) => item.id === eventId)
  if (index === -1) {
    return { ok: false, error: 'رویداد یافت نشد.' }
  }

  const current = list.data[index]

  const nextTitle =
    input.title !== undefined ? input.title.trim() : current.title
  if (!nextTitle) {
    return { ok: false, error: 'عنوان رویداد الزامی است.' }
  }

  const nextDate =
    input.date !== undefined ? input.date.trim() : current.date
  const nextStart =
    input.startTime !== undefined
      ? input.startTime.trim()
      : current.startTime
  const nextEnd =
    input.endTime !== undefined ? input.endTime.trim() : current.endTime

  if (!nextDate) {
    return { ok: false, error: 'تاریخ رویداد الزامی است.' }
  }
  if (!nextStart) {
    return { ok: false, error: 'ساعت شروع الزامی است.' }
  }
  if (!nextEnd) {
    return { ok: false, error: 'ساعت پایان الزامی است.' }
  }

  const range = validateTimeRange(nextDate, nextStart, nextEnd)
  if (!range.ok) return range

  const updated: Event = touch({
    ...current,
    title: nextTitle,
    type: input.type ?? current.type,
    date: nextDate,
    startTime: nextStart,
    endTime: nextEnd,
    location:
      input.location !== undefined
        ? input.location.trim()
        : current.location,
    description:
      input.description !== undefined
        ? input.description.trim()
        : current.description,
    clientId:
      input.clientId !== undefined
        ? normalizeOptionalId(input.clientId)
        : current.clientId,
    caseId:
      input.caseId !== undefined
        ? normalizeOptionalId(input.caseId)
        : current.caseId,
    status: input.status ?? current.status,
  })

  const next = [...list.data]
  next[index] = updated

  const parsed = eventsCollectionSchema.safeParse(next)
  if (!parsed.success) {
    return { ok: false, error: 'داده‌های رویداد نامعتبر است.' }
  }

  const saved = persist(ownerId, parsed.data)
  if (!saved.ok) return saved

  return { ok: true, data: updated }
}

export function deleteEvent(
  ownerId: string,
  eventId: string
): ServiceResult<true> {
  const list = listEvents(ownerId)
  if (!list.ok) return list

  if (!list.data.some((item) => item.id === eventId)) {
    return { ok: false, error: 'رویداد یافت نشد.' }
  }

  const next = list.data.filter((item) => item.id !== eventId)
  const saved = persist(ownerId, next)
  if (!saved.ok) return saved

  return { ok: true, data: true }
}

export function replaceEvents(
  ownerId: string,
  events: Event[]
): ServiceResult<Event[]> {
  const parsed = eventsCollectionSchema.safeParse(events)
  if (!parsed.success) {
    return { ok: false, error: 'ساختار داده‌های رویدادها نامعتبر است.' }
  }
  return persist(ownerId, parsed.data)
}

export function searchEvents(
  events: Event[],
  query: string,
  context: EventSearchContext = {}
): Event[] {
  return filterEvents(events, { query }, context)
}

export function queryEvents(
  events: Event[],
  filters: EventFilters,
  context: EventSearchContext = {}
): Event[] {
  return filterEvents(events, filters, context)
}

export function eventsForDate(events: Event[], date: string): Event[] {
  return getEventsByDate(events, date)
}

export function eventsForCase(events: Event[], caseId: string): Event[] {
  return getEventsByCase(events, caseId)
}

export function eventsForClient(
  events: Event[],
  clientId: string
): Event[] {
  return getEventsByClient(events, clientId)
}
