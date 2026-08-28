import type { Notification } from '../types'
import { api } from '@/lib/api-client'

export async function fetchNotifications(options?: {
  unreadOnly?: boolean
  limit?: number
  cursor?: string
}) {
  const params = new URLSearchParams()
  if (options?.unreadOnly) params.set('unreadOnly', 'true')
  if (options?.limit) params.set('limit', String(options.limit))
  if (options?.cursor) params.set('cursor', options.cursor)

  const qs = params.toString()
  return api<{ items: Notification[] }>(
    `/api/notifications${qs ? `?${qs}` : ''}`
  )
}

export async function fetchUnreadNotificationsCount() {
  return api<{ count: number }>('/api/notifications?count=unread')
}

export async function markNotificationRead(id: string) {
  return api<Notification>(`/api/notifications/${id}/read`, {
    method: 'PATCH',
  })
}

export async function markAllNotificationsRead() {
  return api<{ count: number }>('/api/notifications/read-all', {
    method: 'POST',
  })
}

export async function fetchUnreadByCase() {
  return api<{ items: { caseId: string; total: number }[] }>(
    '/api/notifications/unread-by-case'
  )
}

export async function fetchClientUnseenActivity() {
  return api<{
    items: {
      clientId: string
      total: number
      comments: number
      documents: number
    }[]
    total: number
  }>('/api/clients/unseen-activity')
}

export async function fetchCaseContentActivity() {
  return api<{
    items: {
      caseId: string
      total: number
      comments: number
      documents: number
    }[]
    total: number
  }>('/api/cases/unseen-activity')
}

export async function markCaseNotificationsRead(caseId: string) {
  return api<{ count: number }>(`/api/notifications/cases/${caseId}/read`, {
    method: 'POST',
  })
}
