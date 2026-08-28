import { create } from 'zustand'
import { api } from '@/lib/api-client'
import { useNotificationsStore } from '@/features/notifications/stores/notifications-store'
import { useUnseenActivityStore } from '@/features/notifications/stores/unseen-activity-store'

export type AuthRole = 'super_admin' | 'lawyer' | 'client'

export type AuthUser = {
  id: string
  phone: string
  name: string | null
  email: string | null
  role: AuthRole
}

type MeResponse = {
  user: AuthUser & {
    avatarUrl?: string | null
    title?: string | null
    specialty?: string | null
    barNumber?: string | null
    createdAt?: string
    updatedAt?: string
  }
  needsName: boolean
}

function toAuthUser(user: MeResponse['user']): AuthUser {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

interface AuthState {
  auth: {
    user: AuthUser | null
    hydrated: boolean
    setUser: (user: AuthUser | null) => void
    reset: () => void
    hydrateFromServer: () => Promise<{ ok: true } | { ok: false; error: string }>
    logout: () => Promise<void>
  }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  auth: {
    user: null,
    hydrated: false,
    setUser: (user) =>
      set((state) => ({
        auth: { ...state.auth, user },
      })),
    reset: () =>
      set((state) => ({
        auth: { ...state.auth, user: null, hydrated: true },
      })),
    hydrateFromServer: async () => {
      const result = await api<MeResponse>('/api/auth/me')
      if (!result.ok) {
        set((state) => ({
          auth: { ...state.auth, user: null, hydrated: true },
        }))
        return { ok: false, error: result.error }
      }

      set((state) => ({
        auth: {
          ...state.auth,
          user: toAuthUser(result.data.user),
          hydrated: true,
        },
      }))
      return { ok: true }
    },
    logout: async () => {
      await api('/api/auth/logout', { method: 'POST' })
      useNotificationsStore.getState().reset()
      useUnseenActivityStore.getState().reset()
      get().auth.reset()
    },
  },
}))

export function roleHome(role: AuthRole): string {
  if (role === 'super_admin' || role === 'lawyer') return '/admin'
  return '/dashboard'
}

export function isLawyerRole(role: AuthRole): boolean {
  return role === 'super_admin' || role === 'lawyer'
}
