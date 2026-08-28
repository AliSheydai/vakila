import type {
  CreateEventInput,
  Event,
  UpdateEventInput,
} from '@/features/events/types'
import { query } from '../db'
import { mapEvent } from '../mappers'
import * as notificationService from '../services/notification-service'

type EventRow = {
  id: string
  owner_id: string
  client_user_id: string | null
  title: string
  type: string
  status: string
  event_date: Date | string
  start_time: string
  end_time: string
  starts_at: Date | null
  duration_minutes: number | null
  location: string
  meeting_url: string | null
  description: string
  client_id: string | null
  case_id: string | null
  can_cancel: boolean
  can_reschedule: boolean
  created_at: Date
  updated_at: Date
}

function computeStartsAt(date: string, startTime: string): string {
  return new Date(`${date}T${startTime}:00`).toISOString()
}

function durationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  return mins > 0 ? mins : 60
}

async function resolveEventClientUser(
  ownerId: string,
  clientId?: string | null,
  caseId?: string | null
): Promise<string | null> {
  if (clientId) {
    const { rows } = await query<{ linked_user_id: string | null }>(
      `SELECT linked_user_id FROM clients WHERE id = $1 AND owner_id = $2`,
      [clientId, ownerId]
    )
    if (rows[0]?.linked_user_id) return rows[0].linked_user_id
  }

  if (caseId) {
    const { rows } = await query<{ client_user_id: string | null }>(
      `SELECT client_user_id FROM cases WHERE id = $1 AND owner_id = $2`,
      [caseId, ownerId]
    )
    return rows[0]?.client_user_id ?? null
  }

  return null
}

export async function listEvents(ownerId: string): Promise<Event[]> {
  const { rows } = await query<EventRow>(
    `SELECT * FROM events WHERE owner_id = $1
     ORDER BY event_date DESC, start_time DESC`,
    [ownerId]
  )
  return rows.map(mapEvent)
}

export async function getEvent(
  ownerId: string,
  id: string
): Promise<Event | null> {
  const { rows } = await query<EventRow>(
    `SELECT * FROM events WHERE id = $1 AND owner_id = $2 LIMIT 1`,
    [id, ownerId]
  )
  return rows[0] ? mapEvent(rows[0]) : null
}

export async function createEvent(
  ownerId: string,
  input: CreateEventInput
): Promise<Event> {
  const clientUserId = await resolveEventClientUser(
    ownerId,
    input.clientId,
    input.caseId
  )

  const startsAt = computeStartsAt(input.date, input.startTime)
  const duration = durationMinutes(input.startTime, input.endTime)

  const { rows } = await query<EventRow>(
    `INSERT INTO events (
       owner_id, client_user_id, title, type, status,
       event_date, start_time, end_time, starts_at, duration_minutes,
       location, description, client_id, case_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      ownerId,
      clientUserId,
      input.title.trim(),
      input.type,
      input.status ?? 'scheduled',
      input.date,
      input.startTime,
      input.endTime,
      startsAt,
      duration,
      input.location?.trim() ?? '',
      input.description?.trim() ?? '',
      input.clientId ?? null,
      input.caseId ?? null,
    ]
  )
  const event = mapEvent(rows[0]!)
  await notificationService.notifyEventScheduled({
    clientUserId: clientUserId,
    actorId: ownerId,
    eventId: event.id,
    caseId: event.caseId,
    clientId: event.clientId,
    title: event.title,
    date: event.date,
    startTime: event.startTime,
  })
  return event
}

export async function updateEvent(
  ownerId: string,
  id: string,
  input: UpdateEventInput
): Promise<Event | null> {
  const existing = await getEvent(ownerId, id)
  if (!existing) return null

  const date = input.date ?? existing.date
  const startTime = input.startTime ?? existing.startTime
  const endTime = input.endTime ?? existing.endTime
  const startsAt = computeStartsAt(date, startTime)
  const duration = durationMinutes(startTime, endTime)

  let clientUserId: string | null | undefined
  if (input.clientId !== undefined) {
    clientUserId = input.clientId
      ? ((await resolveEventClientUser(ownerId, input.clientId, null)) ?? null)
      : null
  } else if (input.caseId !== undefined && input.caseId) {
    clientUserId =
      (await resolveEventClientUser(ownerId, null, input.caseId)) ?? null
  }

  const { rows } = await query<EventRow>(
    `UPDATE events SET
       title = COALESCE($3, title),
       type = COALESCE($4, type),
       status = COALESCE($5, status),
       event_date = COALESCE($6::date, event_date),
       start_time = COALESCE($7::time, start_time),
       end_time = COALESCE($8::time, end_time),
       starts_at = $9,
       duration_minutes = $10,
       location = CASE WHEN $11::boolean THEN $12 ELSE location END,
       description = CASE WHEN $13::boolean THEN $14 ELSE description END,
       client_id = CASE WHEN $15::boolean THEN $16 ELSE client_id END,
       case_id = CASE WHEN $17::boolean THEN $18 ELSE case_id END,
       client_user_id = CASE WHEN $19::boolean THEN $20 ELSE client_user_id END
     WHERE id = $1 AND owner_id = $2
     RETURNING *`,
    [
      id,
      ownerId,
      input.title?.trim() ?? null,
      input.type ?? null,
      input.status ?? null,
      input.date ?? null,
      input.startTime ?? null,
      input.endTime ?? null,
      startsAt,
      duration,
      input.location !== undefined,
      input.location?.trim() ?? '',
      input.description !== undefined,
      input.description?.trim() ?? '',
      input.clientId !== undefined,
      input.clientId ?? null,
      input.caseId !== undefined,
      input.caseId ?? null,
      clientUserId !== undefined,
      clientUserId ?? null,
    ]
  )
  if (!rows[0]) return null
  const event = mapEvent(rows[0])
  const cancelled =
    event.status === 'cancelled' && existing.status !== 'cancelled'
  const changed =
    cancelled ||
    event.title !== existing.title ||
    event.type !== existing.type ||
    event.status !== existing.status ||
    event.date !== existing.date ||
    event.startTime !== existing.startTime ||
    event.endTime !== existing.endTime ||
    event.location !== existing.location ||
    event.description !== existing.description ||
    event.clientId !== existing.clientId ||
    event.caseId !== existing.caseId

  if (changed) {
    await notificationService.notifyEventUpdated({
      clientUserId: rows[0].client_user_id,
      actorId: ownerId,
      eventId: event.id,
      caseId: event.caseId,
      clientId: event.clientId,
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      cancelled,
    })
  }
  return event
}

export async function deleteEvent(
  ownerId: string,
  id: string
): Promise<boolean> {
  const { rows: eventRows } = await query<EventRow>(
    `SELECT * FROM events WHERE id = $1 AND owner_id = $2 LIMIT 1`,
    [id, ownerId]
  )
  const row = eventRows[0]
  if (!row) return false

  const { rowCount } = await query(
    `DELETE FROM events WHERE id = $1 AND owner_id = $2`,
    [id, ownerId]
  )

  if ((rowCount ?? 0) > 0) {
    const existing = mapEvent(row)
    await notificationService.notifyEventUpdated({
      clientUserId: row.client_user_id,
      actorId: ownerId,
      eventId: existing.id,
      caseId: existing.caseId,
      clientId: existing.clientId,
      title: existing.title,
      date: existing.date,
      startTime: existing.startTime,
      cancelled: true,
    })
  }

  return (rowCount ?? 0) > 0
}
