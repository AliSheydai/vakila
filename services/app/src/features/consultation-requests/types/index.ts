export type ConsultationRequestStatus =
  | 'new'
  | 'in_review'
  | 'contacted'
  | 'closed'

export type ConsultationRequest = {
  id: string
  ownerId: string
  requesterUserId: string | null
  name: string
  phone: string
  message: string
  status: ConsultationRequestStatus
  lawyerNotes: string | null
  contactedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CreateConsultationRequestInput = {
  name: string
  phone: string
  message: string
}

export type UpdateConsultationRequestInput = {
  status?: ConsultationRequestStatus
  lawyerNotes?: string | null
  contactedAt?: string | null
}

export const CONSULTATION_REQUEST_STATUS_LABELS: Record<
  ConsultationRequestStatus,
  string
> = {
  new: 'جدید',
  in_review: 'در حال بررسی',
  contacted: 'تماس گرفته شد',
  closed: 'بسته شده',
}
