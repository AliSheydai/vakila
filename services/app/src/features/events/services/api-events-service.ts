import { api, type ApiResult } from '@/lib/api-client'
import type {
  CreateEventInput,
  Event,
  EventFilters,
  EventSearchContext,
  UpdateEventInput,
} from '../types'
import * as eventsService from './events-service'

export async function listEvents(): Promise<ApiResult<Event[]>> {
  return api<Event[]>('/api/events')
}

export async function createEvent(
  input: CreateEventInput
): Promise<ApiResult<Event>> {
  return api<Event>('/api/events', { method: 'POST', body: input })
}

export async function updateEvent(
  eventId: string,
  input: UpdateEventInput
): Promise<ApiResult<Event>> {
  return api<Event>(`/api/events/${eventId}`, {
    method: 'PATCH',
    body: input,
  })
}

export async function deleteEvent(eventId: string): Promise<ApiResult<void>> {
  const result = await api<{ deleted: boolean }>(`/api/events/${eventId}`, {
    method: 'DELETE',
  })
  if (!result.ok) return result
  return { ok: true, data: undefined }
}

export function searchEvents(
  events: Event[],
  query: string,
  context?: EventSearchContext
) {
  return eventsService.searchEvents(events, query, context)
}

export function queryEvents(
  events: Event[],
  filters: EventFilters,
  context?: EventSearchContext
) {
  return eventsService.queryEvents(events, filters, context)
}
