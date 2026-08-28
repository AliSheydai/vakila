import { create } from 'zustand'
import * as apiConsultationRequests from '../services/api-consultation-requests-service'
import type {
  ConsultationRequest,
  UpdateConsultationRequestInput,
} from '../types'

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

type ConsultationRequestsState = {
  ownerId: string | null
  requests: ConsultationRequest[]
  newCount: number
  hydrated: boolean
  error: string | null

  hydrate: (ownerId: string) => Promise<ActionResult>
  refreshNewCount: (ownerId: string) => Promise<void>
  reset: () => void

  updateRequest: (
    id: string,
    input: UpdateConsultationRequestInput
  ) => Promise<ActionResult<ConsultationRequest>>

  getNewCount: () => number
  getPendingContactCount: () => number
  getThisWeekCount: () => number
}

function isThisWeek(iso: string, now = new Date()): boolean {
  const date = new Date(iso)
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay())
  return date >= start
}

export const useConsultationRequestsStore = create<ConsultationRequestsState>(
  (set, get) => ({
    ownerId: null,
    requests: [],
    newCount: 0,
    hydrated: false,
    error: null,

    hydrate: async (ownerId) => {
      const [listResult, countResult] = await Promise.all([
        apiConsultationRequests.listConsultationRequests(),
        apiConsultationRequests.fetchNewConsultationRequestsCount(),
      ])

      if (!listResult.ok) {
        set({
          ownerId,
          requests: [],
          newCount: 0,
          hydrated: true,
          error: listResult.error,
        })
        return { ok: false, error: listResult.error }
      }

      set({
        ownerId,
        requests: listResult.data,
        newCount: countResult.ok ? countResult.data.count : 0,
        hydrated: true,
        error: null,
      })

      return { ok: true, data: undefined }
    },

    refreshNewCount: async (ownerId) => {
      const result =
        await apiConsultationRequests.fetchNewConsultationRequestsCount()
      if (result.ok) {
        set({ newCount: result.data.count, ownerId })
      }
    },

    reset: () => {
      set({
        ownerId: null,
        requests: [],
        newCount: 0,
        hydrated: false,
        error: null,
      })
    },

    updateRequest: async (id, input) => {
      const result = await apiConsultationRequests.updateConsultationRequest(
        id,
        input
      )
      if (!result.ok) {
        set({ error: result.error })
        return result
      }

      const requests = get().requests.map((item) =>
        item.id === id ? result.data : item
      )
      const newCount = requests.filter(
        (item) => item.status === 'new'
      ).length

      set({ requests, newCount, error: null })
      return result
    },

    getNewCount: () =>
      get().requests.filter((item) => item.status === 'new').length,

    getPendingContactCount: () =>
      get().requests.filter(
        (item) => item.status === 'new' || item.status === 'in_review'
      ).length,

    getThisWeekCount: () =>
      get().requests.filter((item) => isThisWeek(item.createdAt)).length,
  })
)

export function summarizeConsultationRequests(
  requests: ConsultationRequest[],
  now = new Date()
) {
  return {
    newCount: requests.filter((item) => item.status === 'new').length,
    pendingContactCount: requests.filter(
      (item) => item.status === 'new' || item.status === 'in_review'
    ).length,
    thisWeekCount: requests.filter((item) => isThisWeek(item.createdAt, now))
      .length,
  }
}
