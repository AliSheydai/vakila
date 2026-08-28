import { z } from 'zod'

// ─── Case statuses (موکل) ───────────────────────────────────

export const CLIENT_CASE_STATUSES = [
  'active',
  'under_review',
  'closed',
  'cancelled',
] as const

export type ClientCaseStatus = (typeof CLIENT_CASE_STATUSES)[number]

export const CLIENT_CASE_STATUS_LABELS: Record<ClientCaseStatus, string> = {
  active: 'فعال',
  under_review: 'در انتظار بررسی',
  closed: 'مختومه',
  cancelled: 'لغو شده',
}

export const LEGAL_AREAS = [
  'civil',
  'criminal',
  'family',
  'commercial',
  'labor',
  'administrative',
  'other',
] as const

export type LegalArea = (typeof LEGAL_AREAS)[number]

export const LEGAL_AREA_LABELS: Record<LegalArea, string> = {
  civil: 'حقوقی',
  criminal: 'کیفری',
  family: 'خانواده',
  commercial: 'تجاری',
  labor: 'کار',
  administrative: 'اداری',
  other: 'سایر',
}

// ─── Session ────────────────────────────────────────────────

export const SESSION_TYPES = [
  'consultation',
  'court',
  'online',
  'in_person',
  'follow_up',
] as const

export type SessionType = (typeof SESSION_TYPES)[number]

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  consultation: 'مشاوره',
  court: 'جلسه دادگاه',
  online: 'جلسه آنلاین',
  in_person: 'حضوری',
  follow_up: 'پیگیری',
}

export const SESSION_STATUSES = [
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
] as const

export type SessionStatus = (typeof SESSION_STATUSES)[number]

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'برنامه‌ریزی شده',
  confirmed: 'تأیید شده',
  completed: 'انجام شده',
  cancelled: 'لغو شده',
  no_show: 'عدم حضور',
}

// ─── Payment ────────────────────────────────────────────────

export const PAYMENT_STATUSES = [
  'completed',
  'pending',
  'failed',
  'cancelled',
  'refunded',
] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  completed: 'موفق',
  pending: 'در انتظار پرداخت',
  failed: 'ناموفق',
  cancelled: 'لغو شده',
  refunded: 'برگشت داده شده',
}

export const PAYMENT_METHODS = [
  'online',
  'card',
  'transfer',
  'cheque',
  'cash',
  'other',
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  online: 'درگاه آنلاین',
  card: 'کارت‌خوان',
  transfer: 'انتقال بانکی',
  cheque: 'چک',
  cash: 'نقدی',
  other: 'سایر',
}

// ─── Timeline / Documents ───────────────────────────────────

export const TIMELINE_EVENT_TYPES = [
  'created',
  'review',
  'document',
  'session',
  'status',
  'payment',
  'note',
] as const

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number]

export const DOCUMENT_STATUSES = [
  'available',
  'processing',
  'restricted',
] as const

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  available: 'قابل دانلود',
  processing: 'در حال پردازش',
  restricted: 'محدود',
}

// ─── Case authorship / comments ─────────────────────────────

export const CASE_CREATED_BY = ['lawyer', 'client'] as const
export type CaseCreatedBy = (typeof CASE_CREATED_BY)[number]

export const CASE_CREATED_BY_LABELS: Record<CaseCreatedBy, string> = {
  lawyer: 'ثبت‌شده توسط وکیل',
  client: 'ثبت‌شده توسط موکل',
}

export const COMMENT_AUTHOR_ROLES = ['lawyer', 'client'] as const
export type CommentAuthorRole = (typeof COMMENT_AUTHOR_ROLES)[number]

/** آماده برای فاز بعدی؛ فعلاً UI ویرایش فیلدها ساخته نمی‌شود. */
export function canClientEditCaseFields(caseItem: {
  createdBy: CaseCreatedBy
  lawyerSynced: boolean
}): boolean {
  return caseItem.createdBy === 'client' && !caseItem.lawyerSynced
}

// ─── Zod schemas ───────────────────────────────────────────

export const lawyerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  title: z.string().optional(),
  specialty: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().or(z.literal('')).optional(),
  barNumber: z.string().optional(),
})

export type Lawyer = z.infer<typeof lawyerSchema>

export const clientProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().or(z.literal('')).optional(),
})

export type ClientProfile = z.infer<typeof clientProfileSchema>

export const caseDocumentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().nonnegative(),
  uploadedAt: z.string().datetime(),
  status: z.enum(DOCUMENT_STATUSES),
  uploadedBy: z.string().optional(),
  seenByLawyerAt: z.string().datetime().nullable().optional(),
})

export type CaseDocument = z.infer<typeof caseDocumentSchema>

export const timelineEventSchema = z.object({
  id: z.string().min(1),
  type: z.enum(TIMELINE_EVENT_TYPES),
  title: z.string().min(1),
  description: z.string().optional(),
  occurredAt: z.string().datetime(),
})

export type TimelineEvent = z.infer<typeof timelineEventSchema>

export const caseCommentSchema = z.object({
  id: z.string().min(1),
  authorId: z.string().optional(),
  authorRole: z.enum(COMMENT_AUTHOR_ROLES),
  authorName: z.string().min(1),
  bodyHtml: z.string().default(''),
  attachments: z.array(caseDocumentSchema).default([]),
  seenByLawyerAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
})

export type CaseComment = z.infer<typeof caseCommentSchema>

export const clientCaseSchema = z.object({
  id: z.string().min(1),
  caseNumber: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  descriptionHtml: z.string().default(''),
  legalArea: z.enum(LEGAL_AREAS),
  status: z.enum(CLIENT_CASE_STATUSES),
  lawyerId: z.string().min(1),
  createdBy: z.enum(CASE_CREATED_BY).default('lawyer'),
  lawyerSynced: z.boolean().default(true),
  documents: z.array(caseDocumentSchema).default([]),
  comments: z.array(caseCommentSchema).default([]),
  timeline: z.array(timelineEventSchema).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type ClientCase = z.infer<typeof clientCaseSchema>

export const clientSessionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(SESSION_TYPES),
  status: z.enum(SESSION_STATUSES),
  caseId: z.string().nullable(),
  lawyerId: z.string().min(1),
  startsAt: z.string().datetime(),
  durationMinutes: z.number().positive(),
  location: z.string().optional(),
  meetingUrl: z.union([z.string().url(), z.literal('')]).optional(),
  description: z.string().optional(),
  canCancel: z.boolean().default(false),
  canReschedule: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type ClientSession = z.infer<typeof clientSessionSchema>

export const clientPaymentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  caseId: z.string().nullable(),
  amount: z.number().positive(),
  status: z.enum(PAYMENT_STATUSES),
  method: z.enum(PAYMENT_METHODS),
  transactionId: z.string().optional(),
  paidAt: z.string().datetime().nullable(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type ClientPayment = z.infer<typeof clientPaymentSchema>

export const portalDataSchema = z.object({
  profile: clientProfileSchema,
  lawyers: z.array(lawyerSchema),
  cases: z.array(clientCaseSchema),
  sessions: z.array(clientSessionSchema),
  payments: z.array(clientPaymentSchema),
})

export type PortalData = z.infer<typeof portalDataSchema>

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }
