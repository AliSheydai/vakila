import type {
  CreateEventInput,
  Event,
  UpdateEventInput,
} from '@/features/events/types'
import type { CallStatus } from '@/features/video-call/types'
import { query } from '../db'
import { mapEvent } from '../mappers'
import { buildMeetingUrl } from '../livekit/token'
import * as notificationService from '../services/notification-service'

export type EventRow = {
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
  call_status: string
  recording_url: string | null
  recorded_at: Date | null
  recording_consent_lawyer: boolean
  recording_consent_client: boolean
  reminder_sent_at: Date | null
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

async function ensureOnlineMeetingUrl(
  eventId: string,
  type: string
): Promise<string | null> {
  if (type !== 'online_meeting') return null
  const meetingUrl = buildMeetingUrl(eventId)
  await query(`UPDATE events SET meeting_url = $1 WHERE id = $2`, [
    meetingUrl,
    eventId,
  ])
  return meetingUrl
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

export async function getEventRowById(id: string): Promise<EventRow | null> {
  const { rows } = await query<EventRow>(
    `SELECT * FROM events WHERE id = $1 LIMIT 1`,
    [id]
  )
  return rows[0] ?? null
}

export async function getEventForParticipant(
  eventId: string,
  userId: string,
  role: string
): Promise<EventRow | null> {
  const row = await getEventRowById(eventId)
  if (!row) return null

  const isOwner = row.owner_id === userId
  const isClient = row.client_user_id === userId
  const isAdmin = role === 'super_admin'

  if (isOwner || isClient || (isAdmin && isOwner)) {
    return row
  }

  if (isAdmin) {
    return row
  }

  return null
}

export async function updateCallStatus(
  eventId: string,
  callStatus: CallStatus
): Promise<void> {
  await query(`UPDATE events SET call_status = $1 WHERE id = $2`, [
    callStatus,
    eventId,
  ])
}

export async function setRecordingConsent(
  eventId: string,
  role: 'lawyer' | 'client',
  consent: boolean
): Promise<void> {
  const column =
    role === 'lawyer'
      ? 'recording_consent_lawyer'
      : 'recording_consent_client'
  await query(
    `UPDATE events SET ${column} = $1 WHERE id = $2`,
    [consent, eventId]
  )
}

export async function markEventCompleted(
  ownerId: string,
  eventId: string
): Promise<Event | null> {
  const { rows } = await query<EventRow>(
    `UPDATE events SET status = 'completed', call_status = 'ended'
     WHERE id = $1 AND owner_id = $2
     RETURNING *`,
    [eventId, ownerId]
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

  if (input.type === 'online_meeting' && !clientUserId) {
    throw new Error(
      'برای جلسه آنلاین، موکل باید به حساب کاربری متصل باشد. ابتدا موکل را انتخاب کنید یا پرونده‌ای با موکل لینک‌شده انتخاب کنید.'
    )
  }

  const startsAt = computeStartsAt(input.date, input.startTime)
  const duration = durationMinutes(input.startTime, input.endTime)

  const { rows } = await query<EventRow>(
    `INSERT INTO events (
       owner_id, client_user_id, title, type, status,
       event_date, start_time, end_time, starts_at, duration_minutes,
       location, description, client_id, case_id, can_cancel
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, TRUE)
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

  const row = rows[0]!
  if (input.type === 'online_meeting') {
    row.meeting_url = await ensureOnlineMeetingUrl(row.id, input.type)
  }

  const event = mapEvent(row)
  await notificationService.notifyEventScheduled({
    clientUserId,
    actorId: ownerId,
    eventId: event.id,
    caseId: event.caseId,
    clientId: event.clientId,
    title: event.title,
    date: event.date,
    startTime: event.startTime,
    eventType: event.type,
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
  const nextType = input.type ?? existing.type

  let clientUserId: string | null | undefined
  if (input.clientId !== undefined) {
    clientUserId = input.clientId
      ? ((await resolveEventClientUser(ownerId, input.clientId, null)) ?? null)
      : null
  } else if (input.caseId !== undefined && input.caseId) {
    clientUserId =
      (await resolveEventClientUser(ownerId, null, input.caseId)) ?? null
  }

  if (nextType === 'online_meeting') {
    const resolvedClient =
      clientUserId !== undefined
        ? clientUserId
        : (await getEventRowById(id))?.client_user_id ?? null
    if (!resolvedClient) {
      throw new Error(
        'برای جلسه آنلاین، موکل باید به حساب کاربری متصل باشد.'
      )
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
  if (!rows[0]) return null

  let row = rows[0]
  if (nextType === 'online_meeting') {
    const meetingUrl = await ensureOnlineMeetingUrl(row.id, nextType)
    row = { ...row, meeting_url: meetingUrl }
  } else if (input.type !== undefined && input.type !== 'online_meeting') {
    await query(`UPDATE events SET meeting_url = NULL WHERE id = $1`, [id])
    row = { ...row, meeting_url: null }
  }

  const event = mapEvent(row)
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
      clientUserId: row.client_user_id,
      actorId: ownerId,
      eventId: event.id,
      caseId: event.caseId,
      clientId: event.clientId,
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      cancelled,
      eventType: event.type,
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
      eventType: existing.type,
    })
  }

  return (rowCount ?? 0) > 0
}

export async function listUpcomingEventsForReminders(
  withinMinutes: number
): Promise<EventRow[]> {
  const { rows } = await query<EventRow>(
    `SELECT e.* FROM events e
     LEFT JOIN event_reminder_log rl
       ON rl.event_id = e.id AND rl.reminder_type = $1
     WHERE e.type = 'online_meeting'
       AND e.status = 'scheduled'
       AND rl.event_id IS NULL
       AND e.starts_at IS NOT NULL
       AND e.starts_at > NOW()
       AND e.starts_at <= NOW() + ($2 || ' minutes')::interval`,
    [`${withinMinutes}m`, String(withinMinutes)]
  )
  return rows
}

export async function logReminderSent(
  eventId: string,
  reminderType: string
): Promise<void> {
  await query(
    `INSERT INTO event_reminder_log (event_id, reminder_type)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [eventId, reminderType]
  )
}
