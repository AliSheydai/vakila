export const NOTIFICATION_TYPES = [
  'case_created',
  'case_updated',
  'case_status_changed',
  'client_info_updated',
  'event_scheduled',
  'event_updated',
  'event_cancelled',
  'payment_recorded',
  'payment_deleted',
  'fee_updated',
  'lawyer_comment',
  'lawyer_document',
  'case_created_by_client',
  'client_comment',
  'client_document',
  'client_comment_with_files',
  'session_cancelled_by_client',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export type Notification = {
  id: string
  recipientId: string
  actorId: string | null
  type: NotificationType
  title: string
  body: string
  href: string | null
  caseId: string | null
  clientId: string | null
  eventId: string | null
  readAt: string | null
  createdAt: string
}

export type ClientUnseenActivity = {
  clientId: string
  total: number
  comments: number
  documents: number
}

export type CaseUnseenCount = {
  caseId: string
  total: number
}

export type CaseContentActivity = {
  caseId: string
  total: number
  comments: number
  documents: number
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  case_created: 'پرونده جدید',
  case_updated: 'به‌روزرسانی پرونده',
  case_status_changed: 'تغییر وضعیت پرونده',
  client_info_updated: 'به‌روزرسانی اطلاعات',
  event_scheduled: 'جلسه جدید',
  event_updated: 'تغییر جلسه',
  event_cancelled: 'لغو جلسه',
  payment_recorded: 'ثبت پرداخت',
  payment_deleted: 'حذف پرداخت',
  fee_updated: 'حق‌الوکاله',
  lawyer_comment: 'پیام وکیل',
  lawyer_document: 'فایل وکیل',
  case_created_by_client: 'پرونده جدید از موکل',
  client_comment: 'پیام موکل',
  client_document: 'فایل موکل',
  client_comment_with_files: 'پیام و فایل موکل',
  session_cancelled_by_client: 'لغو جلسه توسط موکل',
}
