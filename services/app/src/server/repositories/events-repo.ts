import type {
  CreateEventInput,
  Event,
  UpdateEventInput,
} from '@/features/events/types'
import { query } from '../db'
import { mapEvent } from '../mappers'

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
  let clientUserId: string | null = null
  if (input.clientId) {
    const { rows } = await query<{ linked_user_id: string | null }>(
      `SELECT linked_user_id FROM clients WHERE id = $1 AND owner_id = $2`,
      [input.clientId, ownerId]
    )
    clientUserId = rows[0]?.linked_user_id ?? null
  }

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
  return mapEvent(rows[0]!)
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
    if (input.clientId) {
      const { rows } = await query<{ linked_user_id: string | null }>(
        `SELECT linked_user_id FROM clients WHERE id = $1 AND owner_id = $2`,
        [input.clientId, ownerId]
      )
      clientUserId = rows[0]?.linked_user_id ?? null
    } else {
      clientUserId = null
    }
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
  return rows[0] ? mapEvent(rows[0]) : null
}

export async function deleteEvent(
  ownerId: string,
  id: string
): Promise<boolean> {
  const { rowCount } = await query(
    `DELETE FROM events WHERE id = $1 AND owner_id = $2`,
    [id, ownerId]
  )
  return (rowCount ?? 0) > 0
}
