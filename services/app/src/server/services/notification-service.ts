import type { CaseStatus } from '@/features/cases/types'
import { CASE_STATUS_LABELS } from '@/features/cases/types'
import type { NotificationType } from '@/features/notifications/types'
import * as notificationsRepo from '../repositories/notifications-repo'

const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const moneyFormatter = new Intl.NumberFormat('fa-IR')

function formatMoney(amount: number): string {
  return `${moneyFormatter.format(amount)} ریال`
}

function formatEventDateTime(date: string, startTime: string): string {
  try {
    const datePart = dateFormatter.format(new Date(`${date}T12:00:00`))
    const timePart = startTime.slice(0, 5)
    return `${datePart} ساعت ${timePart}`
  } catch {
    return `${date} ساعت ${startTime.slice(0, 5)}`
  }
}

async function notifyIfRecipient(
  recipientId: string | null | undefined,
  input: Omit<notificationsRepo.CreateNotificationInput, 'recipientId'>
): Promise<void> {
  if (!recipientId) return
  if (input.actorId && input.actorId === recipientId) return

  try {
    await notificationsRepo.createNotification({
      ...input,
      recipientId,
    })
    const { pushTelegramNotification } = await import(
      '../messenger/telegram/notify'
    )
    await pushTelegramNotification({
      recipientId,
      title: input.title,
      body: input.body,
      caseId: input.caseId,
    })
  } catch (error) {
    console.error('[notification-service] failed to create notification', error)
  }
}

export async function notifyCaseCreatedForClient(params: {
  clientUserId: string | null
  actorId: string
  caseId: string
  clientId: string | null
  title: string
  caseNumber: string
}): Promise<void> {
  await notifyIfRecipient(params.clientUserId, {
    actorId: params.actorId,
    type: 'case_created',
    title: 'پرونده جدید',
    body: `وکیل پرونده «${params.title}» با شماره ${params.caseNumber} برای شما ثبت کرد.`,
    href: `/cases/${params.caseId}`,
    caseId: params.caseId,
    clientId: params.clientId,
  })
}

export async function notifyCaseCreatedByClient(params: {
  lawyerId: string
  actorId: string
  caseId: string
  clientId: string
  clientName: string
  title: string
}): Promise<void> {
  await notifyIfRecipient(params.lawyerId, {
    actorId: params.actorId,
    type: 'case_created_by_client',
    title: 'پرونده جدید از موکل',
    body: `${params.clientName} پرونده «${params.title}» را ثبت کرد و در انتظار بررسی است.`,
    href: `/admin/cases/${params.caseId}`,
    caseId: params.caseId,
    clientId: params.clientId,
  })
}

export async function notifyCaseUpdatedForClient(params: {
  clientUserId: string | null
  actorId: string
  caseId: string
  clientId: string | null
  title: string
  statusChanged?: boolean
  newStatus?: CaseStatus
}): Promise<void> {
  if (params.statusChanged && params.newStatus) {
    const statusLabel = CASE_STATUS_LABELS[params.newStatus] ?? params.newStatus
    await notifyIfRecipient(params.clientUserId, {
      actorId: params.actorId,
      type: 'case_status_changed',
      title: 'تغییر وضعیت پرونده',
      body: `وضعیت پرونده «${params.title}» به «${statusLabel}» تغییر یافت.`,
      href: `/cases/${params.caseId}`,
      caseId: params.caseId,
      clientId: params.clientId,
    })
    return
  }

  await notifyIfRecipient(params.clientUserId, {
    actorId: params.actorId,
    type: 'case_updated',
    title: 'به‌روزرسانی پرونده',
    body: `وکیل اطلاعات پرونده «${params.title}» را به‌روزرسانی کرد.`,
    href: `/cases/${params.caseId}`,
    caseId: params.caseId,
    clientId: params.clientId,
  })
}

export async function notifyClientInfoUpdated(params: {
  linkedUserId: string | null
  actorId: string
  clientId: string
}): Promise<void> {
  await notifyIfRecipient(params.linkedUserId, {
    actorId: params.actorId,
    type: 'client_info_updated',
    title: 'به‌روزرسانی اطلاعات',
    body: 'وکیل اطلاعات حساب شما را ویرایش کرد.',
    href: '/account',
    clientId: params.clientId,
  })
}

export async function notifyEventScheduled(params: {
  clientUserId: string | null
  actorId: string
  eventId: string
  caseId: string | null
  clientId: string | null
  title: string
  date: string
  startTime: string
  eventType?: string
}): Promise<void> {
  const isOnline = params.eventType === 'online_meeting'
  await notifyIfRecipient(params.clientUserId, {
    actorId: params.actorId,
    type: 'event_scheduled',
    title: isOnline ? 'جلسه آنلاین جدید' : 'جلسه جدید',
    body: isOnline
      ? `وکیل جلسه آنلاین «${params.title}» را برای ${formatEventDateTime(params.date, params.startTime)} تنظیم کرد. برای ورود به تماس تصویری از بخش جلسات اقدام کنید.`
      : `وکیل جلسه «${params.title}» را برای ${formatEventDateTime(params.date, params.startTime)} تنظیم کرد.`,
    href: `/sessions/${params.eventId}`,
    caseId: params.caseId,
    clientId: params.clientId,
    eventId: params.eventId,
  })
}

export async function notifyEventUpdated(params: {
  clientUserId: string | null
  actorId: string
  eventId: string
  caseId: string | null
  clientId: string | null
  title: string
  date: string
  startTime: string
  cancelled?: boolean
  eventType?: string
}): Promise<void> {
  if (params.cancelled) {
    await notifyIfRecipient(params.clientUserId, {
      actorId: params.actorId,
      type: 'event_cancelled',
      title: 'لغو جلسه',
      body: `جلسه «${params.title}» لغو شد.`,
      href: `/sessions/${params.eventId}`,
      caseId: params.caseId,
      clientId: params.clientId,
      eventId: params.eventId,
    })
    return
  }

  const isOnline = params.eventType === 'online_meeting'
  await notifyIfRecipient(params.clientUserId, {
    actorId: params.actorId,
    type: 'event_updated',
    title: isOnline ? 'تغییر جلسه آنلاین' : 'تغییر جلسه',
    body: isOnline
      ? `جلسه آنلاین «${params.title}» به ${formatEventDateTime(params.date, params.startTime)} تغییر یافت.`
      : `جلسه «${params.title}» به ${formatEventDateTime(params.date, params.startTime)} تغییر یافت.`,
    href: `/sessions/${params.eventId}`,
    caseId: params.caseId,
    clientId: params.clientId,
    eventId: params.eventId,
  })
}

export async function notifyVideoCallReady(params: {
  clientUserId: string | null
  actorId: string
  eventId: string
  caseId: string | null
  clientId: string | null
  title: string
}): Promise<void> {
  await notifyIfRecipient(params.clientUserId, {
    actorId: params.actorId,
    type: 'video_call_ready',
    title: 'وکیل آماده جلسه است',
    body: `وکیل برای جلسه «${params.title}» آماده است. هم‌اکنون می‌توانید وارد تماس شوید.`,
    href: `/call/${params.eventId}/lobby`,
    caseId: params.caseId,
    clientId: params.clientId,
    eventId: params.eventId,
  })
}

export async function notifyEventReminder(params: {
  clientUserId: string | null
  lawyerId: string
  eventId: string
  caseId: string | null
  clientId: string | null
  title: string
  minutesUntil: number
}): Promise<void> {
  const timeLabel =
    params.minutesUntil <= 5 ? '۵ دقیقه دیگر' : '۱۵ دقیقه دیگر'

  await notifyIfRecipient(params.clientUserId, {
    actorId: params.lawyerId,
    type: 'event_reminder',
    title: 'یادآوری جلسه آنلاین',
    body: `جلسه «${params.title}» ${timeLabel} آغاز می‌شود.`,
    href: `/call/${params.eventId}/lobby`,
    caseId: params.caseId,
    clientId: params.clientId,
    eventId: params.eventId,
  })

  await notifyIfRecipient(params.lawyerId, {
    actorId: params.lawyerId,
    type: 'event_reminder',
    title: 'یادآوری جلسه آنلاین',
    body: `جلسه «${params.title}» ${timeLabel} آغاز می‌شود.`,
    href: `/call/${params.eventId}/lobby`,
    caseId: params.caseId,
    clientId: params.clientId,
    eventId: params.eventId,
  })
}

export async function notifySessionCancelledByClient(params: {
  lawyerId: string
  actorId: string
  eventId: string
  caseId: string | null
  clientId: string | null
  clientName: string
  title: string
}): Promise<void> {
  await notifyIfRecipient(params.lawyerId, {
    actorId: params.actorId,
    type: 'session_cancelled_by_client',
    title: 'لغو جلسه توسط موکل',
    body: `${params.clientName} جلسه «${params.title}» را لغو کرد.`,
    href: '/admin/events',
    caseId: params.caseId,
    clientId: params.clientId,
    eventId: params.eventId,
  })
}

export async function notifyPaymentRecorded(params: {
  clientUserId: string | null
  actorId: string
  caseId: string
  clientId: string | null
  title: string
  amount: number
}): Promise<void> {
  await notifyIfRecipient(params.clientUserId, {
    actorId: params.actorId,
    type: 'payment_recorded',
    title: 'ثبت پرداخت',
    body: `پرداخت ${formatMoney(params.amount)} برای پرونده «${params.title}» ثبت شد.`,
    href: '/payments',
    caseId: params.caseId,
    clientId: params.clientId,
  })
}

export async function notifyPaymentDeleted(params: {
  clientUserId: string | null
  actorId: string
  caseId: string
  clientId: string | null
  title: string
  amount: number
}): Promise<void> {
  await notifyIfRecipient(params.clientUserId, {
    actorId: params.actorId,
    type: 'payment_deleted',
    title: 'حذف پرداخت',
    body: `پرداخت ${formatMoney(params.amount)} از پرونده «${params.title}» حذف شد.`,
    href: '/payments',
    caseId: params.caseId,
    clientId: params.clientId,
  })
}

export async function notifyFeeUpdated(params: {
  clientUserId: string | null
  actorId: string
  caseId: string
  clientId: string | null
  title: string
  amount: number
}): Promise<void> {
  await notifyIfRecipient(params.clientUserId, {
    actorId: params.actorId,
    type: 'fee_updated',
    title: 'تغییر حق‌الوکاله',
    body: `حق‌الوکاله پرونده «${params.title}» به ${formatMoney(params.amount)} تغییر یافت.`,
    href: `/cases/${params.caseId}`,
    caseId: params.caseId,
    clientId: params.clientId,
  })
}

export async function notifyLawyerComment(params: {
  clientUserId: string | null
  actorId: string
  caseId: string
  clientId: string | null
  title: string
}): Promise<void> {
  await notifyIfRecipient(params.clientUserId, {
    actorId: params.actorId,
    type: 'lawyer_comment',
    title: 'پیام جدید از وکیل',
    body: `وکیل در گفتگوی پرونده «${params.title}» پیام جدیدی گذاشت.`,
    href: `/cases/${params.caseId}?tab=comments`,
    caseId: params.caseId,
    clientId: params.clientId,
  })
}

export async function notifyLawyerDocument(params: {
  clientUserId: string | null
  actorId: string
  caseId: string
  clientId: string | null
  title: string
  fileName: string
}): Promise<void> {
  await notifyIfRecipient(params.clientUserId, {
    actorId: params.actorId,
    type: 'lawyer_document',
    title: 'فایل جدید از وکیل',
    body: `وکیل فایل «${params.fileName}» را به پرونده «${params.title}» پیوست کرد.`,
    href: `/cases/${params.caseId}?tab=documents`,
    caseId: params.caseId,
    clientId: params.clientId,
  })
}

export async function notifyClientComment(params: {
  lawyerId: string
  actorId: string
  caseId: string
  clientId: string | null
  clientName: string
  title: string
  attachmentCount?: number
}): Promise<void> {
  const attachmentCount = params.attachmentCount ?? 0
  const type: NotificationType =
    attachmentCount > 0 ? 'client_comment_with_files' : 'client_comment'

  let body = `${params.clientName} در پرونده «${params.title}» پیام جدیدی گذاشت.`
  if (attachmentCount > 0) {
    body = `${params.clientName} در پرونده «${params.title}» پیام و ${attachmentCount.toLocaleString('fa-IR')} فایل ارسال کرد.`
  }

  await notifyIfRecipient(params.lawyerId, {
    actorId: params.actorId,
    type,
    title: attachmentCount > 0 ? 'پیام و فایل از موکل' : 'پیام جدید از موکل',
    body,
    href: `/admin/cases/${params.caseId}?tab=comments`,
    caseId: params.caseId,
    clientId: params.clientId,
  })
}

export async function notifyClientDocument(params: {
  lawyerId: string
  actorId: string
  caseId: string
  clientId: string | null
  clientName: string
  title: string
  fileName: string
}): Promise<void> {
  await notifyIfRecipient(params.lawyerId, {
    actorId: params.actorId,
    type: 'client_document',
    title: 'فایل جدید از موکل',
    body: `${params.clientName} فایل «${params.fileName}» را به پرونده «${params.title}» ارسال کرد.`,
    href: `/admin/cases/${params.caseId}?tab=attachments`,
    caseId: params.caseId,
    clientId: params.clientId,
  })
}
