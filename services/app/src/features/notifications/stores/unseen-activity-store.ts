import { create } from 'zustand'
import * as apiNotifications from '../services/api-notifications-service'
import type {
  CaseUnseenCount,
  CaseContentActivity,
  ClientUnseenActivity,
} from '../types'

type UnseenActivityState = {
  ownerId: string | null
  byClient: ClientUnseenActivity[]
  byCase: CaseUnseenCount[]
  caseContent: CaseContentActivity[]
  totalClientActivity: number
  totalCaseContent: number
  hydrated: boolean

  hydrate: (userId: string, isLawyer: boolean) => Promise<void>
  refresh: (isLawyer: boolean) => Promise<void>
  getClientTotal: (clientId: string) => number
  getClientBreakdown: (clientId: string) => ClientUnseenActivity | null
  getCaseTotal: (caseId: string) => number
  getCaseActivity: (caseId: string) => CaseContentActivity | null
  reset: () => void
}

export const useUnseenActivityStore = create<UnseenActivityState>((set, get) => ({
  ownerId: null,
  byClient: [],
  byCase: [],
  caseContent: [],
  totalClientActivity: 0,
  totalCaseContent: 0,
  hydrated: false,

  hydrate: async (userId, isLawyer) => {
    const caseResult = await apiNotifications.fetchUnreadByCase()

    if (isLawyer) {
      const [clientResult, contentResult] = await Promise.all([
        apiNotifications.fetchClientUnseenActivity(),
        apiNotifications.fetchCaseContentActivity(),
      ])
      const caseContent = contentResult.ok ? contentResult.data.items : []
      set({
        ownerId: userId,
        byClient: clientResult.ok ? clientResult.data.items : [],
        totalClientActivity: clientResult.ok ? clientResult.data.total : 0,
        byCase: caseResult.ok ? caseResult.data.items : [],
        caseContent,
        totalCaseContent: contentResult.ok ? contentResult.data.total : 0,
        hydrated: true,
      })
      return
    }

    set({
      ownerId: userId,
      byClient: [],
      totalClientActivity: 0,
      caseContent: [],
      totalCaseContent: 0,
      byCase: caseResult.ok ? caseResult.data.items : [],
      hydrated: true,
    })
  },

  refresh: async (isLawyer) => {
    const userId = get().ownerId
    if (!userId) return
    await get().hydrate(userId, isLawyer)
  },

  getClientTotal: (clientId) =>
    get().byClient.find((item) => item.clientId === clientId)?.total ?? 0,

  getClientBreakdown: (clientId) =>
    get().byClient.find((item) => item.clientId === clientId) ?? null,

  getCaseTotal: (caseId) =>
    get().byCase.find((item) => item.caseId === caseId)?.total ?? 0,

  getCaseActivity: (caseId) =>
    get().caseContent.find((item) => item.caseId === caseId) ?? null,

  reset: () => {
    set({
      ownerId: null,
      byClient: [],
      byCase: [],
      caseContent: [],
      totalClientActivity: 0,
      totalCaseContent: 0,
      hydrated: false,
    })
  },
}))
