import type {
  ConsultationRequest,
  ConsultationRequestStatus,
  CreateConsultationRequestInput,
  UpdateConsultationRequestInput,
} from '@/features/consultation-requests/types'
import { query } from '../db'
import { mapConsultationRequest } from '../mappers'
import { toLocalDisplay } from '../phone'
import { getDefaultLawyerId } from './clients-repo'

type ConsultationRequestRow = {
  id: string
  owner_id: string
  requester_user_id: string | null
  name: string
  phone: string
  message: string
  status: string
  lawyer_notes: string | null
  contacted_at: Date | string | null
  created_at: Date | string
  updated_at: Date | string
}

export async function createConsultationRequest(
  input: CreateConsultationRequestInput,
  requesterUserId?: string | null
): Promise<ConsultationRequest> {
  const ownerId = await getDefaultLawyerId()
  if (!ownerId) {
    throw new Error('No active lawyer found for consultation requests')
  }

  const phone = toLocalDisplay(input.phone)
  const { rows } = await query<ConsultationRequestRow>(
    `INSERT INTO consultation_requests (
       owner_id, requester_user_id, name, phone, message
     ) VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      ownerId,
      requesterUserId ?? null,
      input.name.trim(),
      phone,
      input.message.trim(),
    ]
  )

  return mapConsultationRequest(rows[0]!)
}

export async function listConsultationRequests(
  ownerId: string
): Promise<ConsultationRequest[]> {
  const { rows } = await query<ConsultationRequestRow>(
    `SELECT * FROM consultation_requests
     WHERE owner_id = $1
     ORDER BY created_at DESC`,
    [ownerId]
  )
  return rows.map(mapConsultationRequest)
}

export async function countNewConsultationRequests(
  ownerId: string
): Promise<number> {
  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM consultation_requests
     WHERE owner_id = $1 AND status = 'new'`,
    [ownerId]
  )
  return Number(rows[0]?.count ?? 0)
}

export async function getConsultationRequest(
  ownerId: string,
  id: string
): Promise<ConsultationRequest | null> {
  const { rows } = await query<ConsultationRequestRow>(
    `SELECT * FROM consultation_requests
     WHERE id = $1 AND owner_id = $2
     LIMIT 1`,
    [id, ownerId]
  )
  return rows[0] ? mapConsultationRequest(rows[0]) : null
}

const VALID_STATUSES: ConsultationRequestStatus[] = [
  'new',
  'in_review',
  'contacted',
  'closed',
]

export async function updateConsultationRequest(
  ownerId: string,
  id: string,
  input: UpdateConsultationRequestInput
): Promise<ConsultationRequest | null> {
  const existing = await getConsultationRequest(ownerId, id)
  if (!existing) return null

  const status =
    input.status !== undefined && VALID_STATUSES.includes(input.status)
      ? input.status
      : existing.status

  const lawyerNotes =
    input.lawyerNotes !== undefined
      ? input.lawyerNotes?.trim() || null
      : existing.lawyerNotes

  let contactedAt = existing.contactedAt
  if (input.contactedAt !== undefined) {
    contactedAt = input.contactedAt
  } else if (status === 'contacted' && !existing.contactedAt) {
    contactedAt = new Date().toISOString()
  }

  const { rows } = await query<ConsultationRequestRow>(
    `UPDATE consultation_requests
     SET status = $3,
         lawyer_notes = $4,
         contacted_at = $5
     WHERE id = $1 AND owner_id = $2
     RETURNING *`,
    [id, ownerId, status, lawyerNotes, contactedAt]
  )

  return rows[0] ? mapConsultationRequest(rows[0]) : null
}
