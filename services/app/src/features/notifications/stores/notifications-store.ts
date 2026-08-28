import { create } from 'zustand'
import * as apiNotifications from '../services/api-notifications-service'
import type { Notification } from '../types'

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

type NotificationsState = {
  userId: string | null
  items: Notification[]
  unreadCount: number
  hydrated: boolean
  error: string | null

  hydrate: (userId: string) => Promise<ActionResult>
  refreshUnreadCount: () => Promise<void>
  loadItems: (unreadOnly?: boolean) => Promise<ActionResult<Notification[]>>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<ActionResult>
  reset: () => void
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  userId: null,
  items: [],
  unreadCount: 0,
  hydrated: false,
  error: null,

  hydrate: async (userId) => {
    const countResult = await apiNotifications.fetchUnreadNotificationsCount()
    set({
      userId,
      unreadCount: countResult.ok ? countResult.data.count : 0,
      hydrated: true,
      error: countResult.ok ? null : countResult.error,
    })
    return countResult.ok
      ? { ok: true, data: undefined }
      : { ok: false, error: countResult.error }
  },

  refreshUnreadCount: async () => {
    const result = await apiNotifications.fetchUnreadNotificationsCount()
    if (result.ok) {
      set({ unreadCount: result.data.count })
    }
  },

  loadItems: async (unreadOnly = false) => {
    const result = await apiNotifications.fetchNotifications({ unreadOnly })
    if (!result.ok) {
      set({ error: result.error })
      return result
    }
    set({ items: result.data.items, error: null })
    return { ok: true, data: result.data.items }
  },

  markRead: async (id) => {
    const result = await apiNotifications.markNotificationRead(id)
    if (!result.ok) return

    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, readAt: result.data.readAt } : item
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }))
  },

  markAllRead: async () => {
    const result = await apiNotifications.markAllNotificationsRead()
    if (!result.ok) {
      return { ok: false, error: result.error }
    }

    const now = new Date().toISOString()
    set((state) => ({
      items: state.items.map((item) => ({ ...item, readAt: item.readAt ?? now })),
      unreadCount: 0,
    }))

    return { ok: true, data: undefined }
  },

  reset: () => {
    set({
      userId: null,
      items: [],
      unreadCount: 0,
      hydrated: false,
      error: null,
    })
  },
}))
