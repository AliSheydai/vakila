import { create } from 'zustand'
import * as apiPortal from '../services/api-portal-service'
import type {
  CaseDocument,
  ClientCase,
  ClientPayment,
  ClientProfile,
  ClientSession,
  Lawyer,
  PortalData,
  ServiceResult,
} from '../types'
import type {
  AddCaseCommentInput,
  CreateCaseInput,
} from '../services/portal-service'

type PortalState = {
  clientId: string | null
  profile: ClientProfile | null
  lawyers: Lawyer[]
  cases: ClientCase[]
  sessions: ClientSession[]
  payments: ClientPayment[]
  hydrated: boolean
  error: string | null

  hydrate: (clientId?: string) => Promise<ServiceResult<void>>
  reset: () => void

  getLawyer: (lawyerId: string) => Lawyer | null
  getCase: (caseId: string) => ClientCase | null
  getSession: (sessionId: string) => ClientSession | null
  getPayment: (paymentId: string) => ClientPayment | null

  createCase: (
    input: CreateCaseInput
  ) => Promise<ServiceResult<ClientCase>>
  addCaseComment: (
    caseId: string,
    input: AddCaseCommentInput
  ) => Promise<ServiceResult<void>>
  deleteCaseComment: (
    caseId: string,
    commentId: string
  ) => Promise<ServiceResult<void>>
  addCaseDocument: (
    caseId: string,
    file: File
  ) => Promise<ServiceResult<CaseDocument>>
  deleteCaseDocument: (
    caseId: string,
    documentId: string
  ) => Promise<ServiceResult<void>>
  cancelSession: (sessionId: string) => Promise<ServiceResult<void>>
  retryPayment: (paymentId: string) => Promise<ServiceResult<void>>
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

async function reloadPortal(
  set: (partial: Partial<PortalState>) => void,
  clientId: string
): Promise<ServiceResult<PortalData>> {
  const result = await apiPortal.fetchPortal()
  if (!result.ok) {
    set({ error: result.error })
    return result
  }
  applyData(set, clientId, result.data)
  return result
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

  hydrate: async (clientId) => {
    const result = await apiPortal.fetchPortal()
    if (!result.ok) {
      set({
        clientId: clientId ?? null,
        hydrated: true,
        error: result.error,
        profile: null,
        lawyers: [],
        cases: [],
        sessions: [],
        payments: [],
      })
      return result
    }

    const resolvedId = clientId ?? result.data.profile.id
    applyData(set, resolvedId, result.data)
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

  createCase: async (input) => {
    const clientId = get().clientId
    if (!clientId) {
      return { ok: false, error: 'شناسه موکل مشخص نیست.' }
    }

    const result = await apiPortal.createPortalCase(input)
    if (!result.ok) return result

    const reloaded = await reloadPortal(set, clientId)
    if (!reloaded.ok) return reloaded

    return { ok: true, data: result.data }
  },

  addCaseComment: async (caseId, input) => {
    const clientId = get().clientId
    if (!clientId) {
      return { ok: false, error: 'شناسه موکل مشخص نیست.' }
    }

    const result = await apiPortal.addPortalComment(caseId, input)
    if (!result.ok) return result

    const reloaded = await reloadPortal(set, clientId)
    if (!reloaded.ok) return reloaded

    return { ok: true, data: undefined as void }
  },

  deleteCaseComment: async (caseId, commentId) => {
    const clientId = get().clientId
    if (!clientId) {
      return { ok: false, error: 'شناسه موکل مشخص نیست.' }
    }

    const result = await apiPortal.deletePortalComment(caseId, commentId)
    if (!result.ok) return result

    const reloaded = await reloadPortal(set, clientId)
    if (!reloaded.ok) return reloaded

    return { ok: true, data: undefined as void }
  },

  addCaseDocument: async (caseId, file) => {
    const result = await apiPortal.addCaseDocument(caseId, file)
    if (!result.ok) return result

    set({
      cases: get().cases.map((item) =>
        item.id === caseId
          ? {
              ...item,
              documents: [
                result.data,
                ...item.documents.filter((doc) => doc.id !== result.data.id),
              ],
            }
          : item
      ),
      error: null,
    })

    const clientId = get().clientId
    if (clientId) {
      void reloadPortal(set, clientId)
    }

    return result
  },

  deleteCaseDocument: async (caseId, documentId) => {
    const clientId = get().clientId
    if (!clientId) {
      return { ok: false, error: 'شناسه موکل مشخص نیست.' }
    }

    const result = await apiPortal.deletePortalCaseDocument(caseId, documentId)
    if (!result.ok) return result

    const reloaded = await reloadPortal(set, clientId)
    if (!reloaded.ok) return reloaded

    return { ok: true, data: undefined as void }
  },

  cancelSession: async (sessionId) => {
    const clientId = get().clientId
    if (!clientId) {
      return { ok: false, error: 'شناسه موکل مشخص نیست.' }
    }

    const result = await apiPortal.cancelPortalSession(sessionId)
    if (!result.ok) return result

    const reloaded = await reloadPortal(set, clientId)
    if (!reloaded.ok) return reloaded

    return { ok: true, data: undefined as void }
  },

  retryPayment: async (paymentId) => apiPortal.retryPayment(paymentId),
}))
