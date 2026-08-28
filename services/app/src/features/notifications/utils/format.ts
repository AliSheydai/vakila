import {
  Briefcase,
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  User,
  type LucideIcon,
} from 'lucide-react'
import type { NotificationType } from '../types'

export function getNotificationIcon(type: NotificationType): LucideIcon {
  switch (type) {
    case 'case_created':
    case 'case_updated':
    case 'case_status_changed':
    case 'case_created_by_client':
      return Briefcase
    case 'client_info_updated':
      return User
    case 'event_scheduled':
    case 'event_updated':
    case 'event_cancelled':
    case 'session_cancelled_by_client':
      return Calendar
    case 'payment_recorded':
    case 'payment_deleted':
    case 'fee_updated':
      return CreditCard
    case 'lawyer_document':
    case 'client_document':
      return FileText
    default:
      return MessageSquare
  }
}

export type NotificationDateGroup = 'today' | 'yesterday' | 'thisWeek' | 'older'

export function getNotificationDateGroup(iso: string): NotificationDateGroup {
  const date = new Date(iso)
  const now = new Date()

  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfWeek.getDate() - 7)

  if (date >= startOfToday) return 'today'
  if (date >= startOfYesterday) return 'yesterday'
  if (date >= startOfWeek) return 'thisWeek'
  return 'older'
}

export const NOTIFICATION_GROUP_LABELS: Record<NotificationDateGroup, string> =
  {
    today: 'امروز',
    yesterday: 'دیروز',
    thisWeek: 'این هفته',
    older: 'قدیمی‌تر',
  }

export function formatNotificationTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}
