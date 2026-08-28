import type {
  Attachment,
  Case,
  Client,
  Expense,
  Fee,
  Payment,
} from '@/features/cases/types'
import type { ConsultationRequest } from '@/features/consultation-requests/types'
import type { Notification } from '@/features/notifications/types'
import type { Event } from '@/features/events/types'
import type {
  CaseComment,
  CaseDocument,
  ClientCase,
  ClientPayment,
  ClientProfile,
  ClientSession,
  Lawyer,
  TimelineEvent,
} from '@/features/client-portal/types'
import { num, toIso, toIsoRequired } from './serialize'

export function hhmm(time: string | Date): string {
  if (typeof time === 'string') {
    // "HH:MM:SS" or "HH:MM"
    return time.slice(0, 5)
  }
  const h = String(time.getUTCHours()).padStart(2, '0')
  const m = String(time.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function ymd(date: string | Date): string {
  if (typeof date === 'string') return date.slice(0, 10)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function mapAttachment(row: {
  id: string
  name: string
  mime_type: string
  size_bytes: string | number
  created_at: Date | string
  uploaded_by?: string | null
}): Attachment {
  return {
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    size: num(row.size_bytes),
    uploadedAt: toIsoRequired(row.created_at),
    uploadedBy: row.uploaded_by ?? undefined,
  }
}

export function mapFee(row: {
  id: string
  amount: string | number
  description: string | null
  due_date: Date | string | null
  created_at: Date | string
  updated_at: Date | string
}): Fee {
  return {
    id: row.id,
    amount: num(row.amount),
    description: row.description ?? undefined,
    dueDate: toIso(row.due_date),
    createdAt: toIsoRequired(row.created_at),
    updatedAt: toIsoRequired(row.updated_at),
  }
}

export function mapPayment(row: {
  id: string
  amount: string | number
  paid_at: Date | string | null
  method: string
  source: string
  status: string
  description: string | null
  external_transaction_id: string | null
  created_at: Date | string
  updated_at: Date | string
}): Payment {
  const status =
    row.status === 'completed' || row.status === 'pending' || row.status === 'failed'
      ? row.status
      : 'completed'
  return {
    id: row.id,
    amount: num(row.amount),
    date: toIsoRequired(row.paid_at ?? row.created_at),
    method: row.method as Payment['method'],
    source: row.source as Payment['source'],
    status,
    description: row.description ?? undefined,
    externalTransactionId: row.external_transaction_id ?? undefined,
    createdAt: toIsoRequired(row.created_at),
    updatedAt: toIsoRequired(row.updated_at),
  }
}

export function mapExpense(row: {
  id: string
  title: string
  category: string
  amount: string | number
  expense_date: Date | string
  description: string | null
  created_at: Date | string
  updated_at: Date | string
}): Expense {
  return {
    id: row.id,
    title: row.title,
    category: row.category as Expense['category'],
    amount: num(row.amount),
    date: toIsoRequired(row.expense_date),
    description: row.description ?? undefined,
    createdAt: toIsoRequired(row.created_at),
    updatedAt: toIsoRequired(row.updated_at),
  }
}

export function mapClient(
  row: {
    id: string
    owner_id: string
    name: string
    phone: string
    email: string | null
    citizenship: 'iranian' | 'foreign' | null
    national_id: string | null
    avatar_data_url: string | null
    notes: string | null
    created_at: Date | string
    updated_at: Date | string
  },
  attachments: Attachment[] = []
): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? '',
    citizenship: row.citizenship ?? undefined,
    nationalId: row.national_id ?? undefined,
    avatarDataUrl: row.avatar_data_url ?? undefined,
    notes: row.notes ?? undefined,
    attachments,
    ownerId: row.owner_id,
    createdAt: toIsoRequired(row.created_at),
    updatedAt: toIsoRequired(row.updated_at),
  }
}

export function mapCase(input: {
  row: {
    id: string
    case_number: string
    title: string
    description: string
    legal_area: string
    status: string
    owner_id: string
    client_id: string | null
    created_at: Date | string
    updated_at: Date | string
  }
  fee: Fee | null
  payments: Payment[]
  expenses: Expense[]
  attachments: Attachment[]
}): Case {
  const status = input.row.status === 'cancelled' ? 'archived' : input.row.status
  return {
    id: input.row.id,
    caseNumber: input.row.case_number,
    title: input.row.title,
    description: input.row.description,
    legalArea: input.row.legal_area as Case['legalArea'],
    status: status as Case['status'],
    clientId: input.row.client_id,
    ownerId: input.row.owner_id,
    fee: input.fee,
    payments: input.payments,
    expenses: input.expenses,
    attachments: input.attachments,
    createdAt: toIsoRequired(input.row.created_at),
    updatedAt: toIsoRequired(input.row.updated_at),
  }
}

export function mapEvent(row: {
  id: string
  title: string
  type: string
  event_date: Date | string
  start_time: string | Date
  end_time: string | Date
  location: string
  meeting_url?: string | null
  description: string
  client_id: string | null
  case_id: string | null
  status: string
  owner_id: string
  call_status?: string
  recording_url?: string | null
  recorded_at?: Date | string | null
  recording_consent_lawyer?: boolean
  recording_consent_client?: boolean
  created_at: Date | string
  updated_at: Date | string
}): Event {
  const status =
    row.status === 'scheduled' ||
    row.status === 'completed' ||
    row.status === 'cancelled'
      ? row.status
      : row.status === 'confirmed'
        ? 'scheduled'
        : 'scheduled'

  const type = [
    'client_meeting',
    'court_hearing',
    'online_meeting',
    'legal_deadline',
    'reminder',
    'other',
  ].includes(row.type)
    ? row.type
    : 'other'

  return {
    id: row.id,
    title: row.title,
    type: type as Event['type'],
    date: ymd(row.event_date),
    startTime: hhmm(row.start_time),
    endTime: hhmm(row.end_time),
    location: row.location ?? '',
    meetingUrl: row.meeting_url ?? '',
    description: row.description ?? '',
    clientId: row.client_id,
    caseId: row.case_id,
    status,
    callStatus: normalizeCallStatus(row.call_status),
    recordingUrl: row.recording_url ?? null,
    recordedAt: row.recorded_at ? toIsoRequired(row.recorded_at) : null,
    recordingConsentLawyer: row.recording_consent_lawyer ?? false,
    recordingConsentClient: row.recording_consent_client ?? false,
    ownerId: row.owner_id,
    createdAt: toIsoRequired(row.created_at),
    updatedAt: toIsoRequired(row.updated_at),
  }
}

function normalizeCallStatus(value: string | undefined): Event['callStatus'] {
  const statuses = ['idle', 'lobby', 'waiting', 'in_call', 'ended'] as const
  if (value && statuses.includes(value as (typeof statuses)[number])) {
    return value as Event['callStatus']
  }
  return 'idle'
}

export function mapCaseDocument(row: {
  id: string
  name: string
  mime_type: string
  size_bytes: string | number
  status: string
  created_at: Date | string
  uploaded_by?: string | null
  seen_by_lawyer_at?: Date | string | null
}): CaseDocument {
  return {
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    size: num(row.size_bytes),
    uploadedAt: toIsoRequired(row.created_at),
    status: row.status as CaseDocument['status'],
    uploadedBy: row.uploaded_by ?? undefined,
    seenByLawyerAt: row.seen_by_lawyer_at
      ? toIsoRequired(row.seen_by_lawyer_at)
      : null,
  }
}

export function mapCaseComment(
  row: {
    id: string
    author_id?: string | null
    author_role: string
    author_name: string
    body_html: string
    created_at: Date | string
    seen_by_lawyer_at?: Date | string | null
  },
  attachments: CaseDocument[] = []
): CaseComment {
  return {
    id: row.id,
    authorId: row.author_id ?? undefined,
    authorRole: row.author_role as CaseComment['authorRole'],
    authorName: row.author_name,
    bodyHtml: row.body_html,
    attachments,
    seenByLawyerAt: row.seen_by_lawyer_at
      ? toIsoRequired(row.seen_by_lawyer_at)
      : null,
    createdAt: toIsoRequired(row.created_at),
  }
}

export function mapTimeline(row: {
  id: string
  type: string
  title: string
  description: string | null
  occurred_at: Date | string
}): TimelineEvent {
  return {
    id: row.id,
    type: row.type as TimelineEvent['type'],
    title: row.title,
    description: row.description ?? undefined,
    occurredAt: toIsoRequired(row.occurred_at),
  }
}

export function mapClientCase(input: {
  row: {
    id: string
    case_number: string
    title: string
    description: string
    description_html: string
    legal_area: string
    status: string
    owner_id: string
    created_by: 'lawyer' | 'client'
    lawyer_synced: boolean
    created_at: Date | string
    updated_at: Date | string
  }
  documents: CaseDocument[]
  comments: CaseComment[]
  timeline: TimelineEvent[]
}): ClientCase {
  const statusMap: Record<string, ClientCase['status']> = {
    new: 'under_review',
    under_review: 'under_review',
    active: 'active',
    awaiting_action: 'active',
    closed: 'closed',
    archived: 'closed',
    cancelled: 'cancelled',
  }
  return {
    id: input.row.id,
    caseNumber: input.row.case_number,
    title: input.row.title,
    description: input.row.description,
    descriptionHtml: input.row.description_html,
    legalArea: input.row.legal_area as ClientCase['legalArea'],
    status: statusMap[input.row.status] ?? 'under_review',
    lawyerId: input.row.owner_id,
    createdBy: input.row.created_by,
    lawyerSynced: input.row.lawyer_synced,
    documents: input.documents,
    comments: input.comments,
    timeline: input.timeline,
    createdAt: toIsoRequired(input.row.created_at),
    updatedAt: toIsoRequired(input.row.updated_at),
  }
}

export function mapLawyer(row: {
  id: string
  name: string | null
  title: string | null
  specialty: string | null
  phone: string
  email: string | null
  bar_number: string | null
}): Lawyer {
  return {
    id: row.id,
    name: row.name || 'وکیل',
    title: row.title ?? undefined,
    specialty: row.specialty || 'عمومی',
    phone: row.phone,
    email: row.email ?? '',
    barNumber: row.bar_number ?? undefined,
  }
}

export function mapClientProfile(row: {
  id: string
  name: string | null
  phone: string
  email: string | null
}): ClientProfile {
  return {
    id: row.id,
    name: row.name || 'موکل',
    phone: row.phone,
    email: row.email ?? '',
  }
}

export function mapClientSession(row: {
  id: string
  title: string
  type: string
  status: string
  case_id: string | null
  owner_id: string
  starts_at: Date | string | null
  event_date: Date | string
  start_time: string | Date
  duration_minutes: number | null
  location: string
  meeting_url: string | null
  description: string
  can_cancel: boolean
  can_reschedule: boolean
  created_at: Date | string
  updated_at: Date | string
}): ClientSession {
  const typeMap: Record<string, ClientSession['type']> = {
    consultation: 'consultation',
    court: 'court',
    online: 'online',
    in_person: 'in_person',
    follow_up: 'follow_up',
    online_meeting: 'online',
    client_meeting: 'consultation',
    court_hearing: 'court',
  }

  const type = typeMap[row.type] ?? 'consultation'

  let startsAt = toIso(row.starts_at)
  if (!startsAt) {
    const date = ymd(row.event_date)
    const time = hhmm(row.start_time)
    startsAt = new Date(`${date}T${time}:00`).toISOString()
  }

  return {
    id: row.id,
    title: row.title,
    type,
    status: row.status as ClientSession['status'],
    caseId: row.case_id,
    lawyerId: row.owner_id,
    startsAt,
    durationMinutes: row.duration_minutes && row.duration_minutes > 0
      ? row.duration_minutes
      : 60,
    location: row.location || undefined,
    meetingUrl: row.meeting_url ?? '',
    description: row.description || undefined,
    canCancel: row.can_cancel,
    canReschedule: row.can_reschedule,
    createdAt: toIsoRequired(row.created_at),
    updatedAt: toIsoRequired(row.updated_at),
  }
}

export function mapClientPayment(row: {
  id: string
  title: string | null
  case_id: string | null
  amount: string | number
  status: string
  method: string
  external_transaction_id: string | null
  paid_at: Date | string | null
  description: string | null
  created_at: Date | string
  updated_at: Date | string
}): ClientPayment {
  return {
    id: row.id,
    title: row.title || 'پرداخت',
    caseId: row.case_id,
    amount: num(row.amount),
    status: row.status as ClientPayment['status'],
    method: row.method as ClientPayment['method'],
    transactionId: row.external_transaction_id ?? undefined,
    paidAt: toIso(row.paid_at),
    description: row.description ?? undefined,
    createdAt: toIsoRequired(row.created_at),
    updatedAt: toIsoRequired(row.updated_at),
  }
}

export function mapNotification(row: {
  id: string
  recipient_id: string
  actor_id: string | null
  type: string
  title: string
  body: string
  href: string | null
  case_id: string | null
  client_id: string | null
  event_id: string | null
  read_at: Date | string | null
  created_at: Date | string
}): Notification {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    actorId: row.actor_id,
    type: row.type as Notification['type'],
    title: row.title,
    body: row.body,
    href: row.href,
    caseId: row.case_id,
    clientId: row.client_id,
    eventId: row.event_id,
    readAt: toIso(row.read_at),
    createdAt: toIsoRequired(row.created_at),
  }
}

export function mapConsultationRequest(row: {
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
}): ConsultationRequest {
  return {
    id: row.id,
    ownerId: row.owner_id,
    requesterUserId: row.requester_user_id,
    name: row.name,
    phone: row.phone,
    message: row.message,
    status: row.status as ConsultationRequest['status'],
    lawyerNotes: row.lawyer_notes,
    contactedAt: toIso(row.contacted_at),
    createdAt: toIsoRequired(row.created_at),
    updatedAt: toIsoRequired(row.updated_at),
  }
}
