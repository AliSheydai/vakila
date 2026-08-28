import { z } from 'zod'
import { CALL_STATUSES } from '@/features/video-call/types'

/** انواع رویداد — نسخه اولیه */
export const EVENT_TYPES = [
  'client_meeting',
  'court_hearing',
  'online_meeting',
  'legal_deadline',
  'reminder',
  'other',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  client_meeting: 'جلسه با موکل',
  court_hearing: 'جلسه دادگاه',
  online_meeting: 'جلسه آنلاین',
  legal_deadline: 'مهلت قانونی',
  reminder: 'یادآوری',
  other: 'سایر',
}

/** وضعیت ذخیره‌شدهٔ رویداد */
export const EVENT_STATUSES = [
  'scheduled',
  'completed',
  'cancelled',
] as const

export type EventStatus = (typeof EVENT_STATUSES)[number]

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: 'برنامه‌ریزی‌شده',
  completed: 'انجام‌شده',
  cancelled: 'لغو‌شده',
}

/** وضعیت زمانی محاسبه‌شده — ذخیره نمی‌شود */
export const EVENT_TEMPORAL_STATUSES = ['today', 'upcoming', 'past'] as const

export type EventTemporalStatus = (typeof EVENT_TEMPORAL_STATUSES)[number]

export const EVENT_TEMPORAL_STATUS_LABELS: Record<EventTemporalStatus, string> =
  {
    today: 'امروز',
    upcoming: 'آینده',
    past: 'گذشته',
  }

const timeHHmmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'ساعت نامعتبر است.')

const dateYmdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ نامعتبر است.')

/**
 * Event موجودیت مستقل است.
 * date به‌صورت YYYY-MM-DD (میلادی برای ذخیره) و زمان‌ها HH:mm.
 * clientId / caseId اختیاری‌اند و برای اتصال آینده به صفحات موکل/پرونده آماده‌اند.
 */
export const eventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(EVENT_TYPES),
  date: dateYmdSchema,
  startTime: timeHHmmSchema,
  endTime: timeHHmmSchema,
  location: z.string().default(''),
  meetingUrl: z.string().default(''),
  description: z.string().default(''),
  clientId: z.string().nullable(),
  caseId: z.string().nullable(),
  status: z.enum(EVENT_STATUSES),
  callStatus: z.enum(CALL_STATUSES).default('idle'),
  recordingUrl: z.string().nullable().optional(),
  recordedAt: z.string().datetime().nullable().optional(),
  recordingConsentLawyer: z.boolean().default(false),
  recordingConsentClient: z.boolean().default(false),
  ownerId: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Event = z.infer<typeof eventSchema>

export const eventsCollectionSchema = z.array(eventSchema)

export type CreateEventInput = {
  title: string
  type: EventType
  date: string
  startTime: string
  endTime: string
  location?: string
  description?: string
  clientId?: string | null
  caseId?: string | null
  status?: EventStatus
}

export type UpdateEventInput = Partial<CreateEventInput>

export type EventTypeFilter = EventType | 'all'

export type EventTemporalFilter = EventTemporalStatus | 'all'

export type EventRelationFilter = 'all' | 'with_case' | 'with_client'

export type EventSearchContext = {
  clientNameById?: Record<string, string>
  caseTitleById?: Record<string, string>
}

export type EventFilters = {
  query?: string
  type?: EventTypeFilter
  temporal?: EventTemporalFilter
  relation?: EventRelationFilter
  caseId?: string | null
  clientId?: string | null
  /** مرجع زمانی برای فیلتر today/upcoming/past — پیش‌فرض الآن */
  now?: Date
}

export type { EventsCalendarMode, EventsSurface } from './ui'
