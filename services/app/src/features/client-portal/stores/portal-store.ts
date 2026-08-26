import { create } from 'zustand'
import * as portalService from '../services/portal-service'
import type {
  ClientCase,
  ClientPayment,
  ClientProfile,
  ClientSession,
  Lawyer,
  PortalData,
  ServiceResult,
} from '../types'
import { DEMO_CLIENT_ID } from '../utils/seed'

type PortalState = {
  clientId: string | null
  profile: ClientProfile | null
  lawyers: Lawyer[]
  cases: ClientCase[]
  sessions: ClientSession[]
  payments: ClientPayment[]
  hydrated: boolean
  error: string | null

  hydrate: (clientId?: string) => ServiceResult<void>
  reset: () => void

  getLawyer: (lawyerId: string) => Lawyer | null
  getCase: (caseId: string) => ClientCase | null
  getSession: (sessionId: string) => ClientSession | null
  getPayment: (paymentId: string) => ClientPayment | null

  cancelSession: (sessionId: string) => ServiceResult<void>
  retryPayment: (paymentId: string) => ServiceResult<void>
}

function applyData(
  set: (partial: Partial<PortalState>) => void,
  clientId: string,
  data: PortalData
) {
  set({
    clientId,
    profile: data.profile,
    lawyers: data.lawyers,
    cases: data.cases,
    sessions: data.sessions,
    payments: data.payments,
    hydrated: true,
    error: null,
  })
}

export const usePortalStore = create<PortalState>()((set, get) => ({
  clientId: null,
  profile: null,
  lawyers: [],
  cases: [],
  sessions: [],
  payments: [],
  hydrated: false,
  error: null,

  hydrate: (clientId = DEMO_CLIENT_ID) => {
    const seeded = portalService.seedDemoIfEmpty(clientId)
    if (!seeded.ok) {
      set({
        clientId,
        hydrated: true,
        error: seeded.error,
        profile: null,
        lawyers: [],
        cases: [],
        sessions: [],
        payments: [],
      })
      return seeded
    }

    applyData(set, clientId, seeded.data)
    return { ok: true, data: undefined as void }
  },

  reset: () =>
    set({
      clientId: null,
      profile: null,
      lawyers: [],
      cases: [],
      sessions: [],
      payments: [],
      hydrated: false,
      error: null,
    }),

  getLawyer: (lawyerId) =>
    get().lawyers.find((item) => item.id === lawyerId) ?? null,

  getCase: (caseId) => get().cases.find((item) => item.id === caseId) ?? null,

  getSession: (sessionId) =>
    get().sessions.find((item) => item.id === sessionId) ?? null,

  getPayment: (paymentId) =>
    get().payments.find((item) => item.id === paymentId) ?? null,

  cancelSession: (sessionId) => {
    const clientId = get().clientId
    if (!clientId) {
      return { ok: false, error: 'شناسه موکل مشخص نیست.' }
    }

    const result = portalService.cancelSession(clientId, sessionId)
    if (!result.ok) return result

    applyData(set, clientId, result.data)
    return { ok: true, data: undefined as void }
  },

  retryPayment: (paymentId) => {
    const clientId = get().clientId
    if (!clientId) {
      return { ok: false, error: 'شناسه موکل مشخص نیست.' }
    }

    const result = portalService.retryPayment(clientId, paymentId)
    if (!result.ok) return result

    applyData(set, clientId, result.data)
    return { ok: true, data: undefined as void }
  },
}))
