import { create } from 'zustand'
import * as apiCases from '../services/api-cases-service'
import * as apiClients from '../services/api-clients-service'
import type {
  Case,
  Client,
  CreateAttachmentInput,
  CreateCaseInput,
  CreateClientInput,
  CreateExpenseInput,
  CreatePaymentInput,
  UpdateCaseInput,
  UpdateClientInput,
  UpsertFeeInput,
} from '../types'
import { getCasesForClient } from '../utils/clients'

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

type CasesState = {
  ownerId: string | null
  cases: Case[]
  clients: Client[]
  hydrated: boolean
  error: string | null

  hydrate: (ownerId: string) => Promise<ActionResult>
  reset: () => void

  addClient: (input: CreateClientInput) => Promise<ActionResult<Client>>
  updateClient: (
    clientId: string,
    input: UpdateClientInput
  ) => Promise<ActionResult<Client>>
  deleteClient: (clientId: string) => Promise<ActionResult>
  getClient: (clientId: string) => Client | null
  searchClients: (query: string) => Client[]
  getClientCases: (clientId: string) => Case[]

  addClientAttachment: (
    clientId: string,
    input: CreateAttachmentInput
  ) => Promise<ActionResult<Client>>
  deleteClientAttachment: (
    clientId: string,
    attachmentId: string
  ) => Promise<ActionResult<Client>>

  addCase: (input: CreateCaseInput) => Promise<ActionResult<Case>>
  updateCase: (
    caseId: string,
    input: UpdateCaseInput
  ) => Promise<ActionResult<Case>>
  deleteCase: (caseId: string) => Promise<ActionResult>
  getCase: (caseId: string) => Case | null

  upsertFee: (
    caseId: string,
    input: UpsertFeeInput
  ) => Promise<ActionResult<Case>>
  addPayment: (
    caseId: string,
    input: CreatePaymentInput
  ) => Promise<ActionResult<Case>>
  deletePayment: (
    caseId: string,
    paymentId: string
  ) => Promise<ActionResult<Case>>
  addExpense: (
    caseId: string,
    input: CreateExpenseInput
  ) => Promise<ActionResult<Case>>
  deleteExpense: (
    caseId: string,
    expenseId: string
  ) => Promise<ActionResult<Case>>
  addAttachment: (
    caseId: string,
    input: CreateAttachmentInput
  ) => Promise<ActionResult<Case>>
  deleteAttachment: (
    caseId: string,
    attachmentId: string
  ) => Promise<ActionResult<Case>>
}

function syncCaseIntoState(
  set: (partial: Partial<CasesState>) => void,
  get: () => CasesState,
  updated: Case
) {
  set({
    cases: get().cases.map((item) =>
      item.id === updated.id ? updated : item
    ),
    error: null,
  })
}

async function refreshCase(
  set: (partial: Partial<CasesState>) => void,
  get: () => CasesState,
  caseId: string
): Promise<ActionResult<Case>> {
  const refreshed = await apiCases.getCase(caseId)
  if (!refreshed.ok) {
    set({ error: refreshed.error })
    return refreshed
  }
  const existing = get().cases.some((c) => c.id === caseId)
  if (existing) {
    syncCaseIntoState(set, get, refreshed.data)
  } else {
    set({ cases: [...get().cases, refreshed.data], error: null })
  }
  return { ok: true, data: refreshed.data }
}

export const useCasesStore = create<CasesState>((set, get) => ({
  ownerId: null,
  cases: [],
  clients: [],
  hydrated: false,
  error: null,

  hydrate: async (ownerId) => {
    const [casesResult, clientsResult] = await Promise.all([
      apiCases.listCases(),
      apiClients.listClients(),
    ])

    if (!casesResult.ok) {
      set({
        ownerId,
        cases: [],
        clients: [],
        hydrated: true,
        error: casesResult.error,
      })
      return { ok: false, error: casesResult.error }
    }

    if (!clientsResult.ok) {
      set({
        ownerId,
        cases: casesResult.data,
        clients: [],
        hydrated: true,
        error: clientsResult.error,
      })
      return { ok: false, error: clientsResult.error }
    }

    set({
      ownerId,
      cases: casesResult.data,
      clients: clientsResult.data,
      hydrated: true,
      error: null,
    })

    return { ok: true, data: undefined }
  },

  reset: () => {
    set({
      ownerId: null,
      cases: [],
      clients: [],
      hydrated: false,
      error: null,
    })
  },

  addClient: async (input) => {
    const result = await apiClients.createClient(input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    set({
      clients: [result.data, ...get().clients],
      error: null,
    })
    return result
  },

  updateClient: async (clientId, input) => {
    const result = await apiClients.updateClient(clientId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    set({
      clients: get().clients.map((client) =>
        client.id === clientId ? result.data : client
      ),
      error: null,
    })
    return result
  },

  deleteClient: async (clientId) => {
    const hasLinkedCases = get().cases.some(
      (item) => item.clientId === clientId
    )
    if (hasLinkedCases) {
      const error =
        'این موکل به پرونده متصل است. ابتدا ارتباط پرونده‌ها را قطع کنید.'
      set({ error })
      return { ok: false, error }
    }

    const result = await apiClients.deleteClient(clientId)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    set({
      clients: get().clients.filter((client) => client.id !== clientId),
      error: null,
    })
    return { ok: true, data: undefined }
  },

  getClient: (clientId) =>
    get().clients.find((client) => client.id === clientId) ?? null,

  searchClients: (query) => apiClients.searchClients(get().clients, query),

  getClientCases: (clientId) => getCasesForClient(get().cases, clientId),

  addClientAttachment: async () => ({
    ok: false,
    error: 'آپلود مدرک موکل هنوز به سرور متصل نشده است.',
  }),

  deleteClientAttachment: async () => ({
    ok: false,
    error: 'حذف مدرک موکل هنوز به سرور متصل نشده است.',
  }),

  addCase: async (input) => {
    const result = await apiCases.createCase(input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    set({
      cases: [result.data, ...get().cases],
      error: null,
    })
    return result
  },

  updateCase: async (caseId, input) => {
    const result = await apiCases.updateCase(caseId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    syncCaseIntoState(set, get, result.data)
    return result
  },

  deleteCase: async (caseId) => {
    const result = await apiCases.deleteCase(caseId)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    set({
      cases: get().cases.filter((item) => item.id !== caseId),
      error: null,
    })
    return { ok: true, data: undefined }
  },

  getCase: (caseId) => get().cases.find((item) => item.id === caseId) ?? null,

  upsertFee: async (caseId, input) => {
    const result = await apiCases.upsertFee(caseId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }
    return refreshCase(set, get, caseId)
  },

  addPayment: async (caseId, input) => {
    const result = await apiCases.addPayment(caseId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }
    return refreshCase(set, get, caseId)
  },

  deletePayment: async (caseId, paymentId) => {
    const result = await apiCases.deletePayment(caseId, paymentId)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }
    return refreshCase(set, get, caseId)
  },

  addExpense: async (caseId, input) => {
    const result = await apiCases.addExpense(caseId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }
    return refreshCase(set, get, caseId)
  },

  deleteExpense: async (caseId, expenseId) => {
    const result = await apiCases.deleteExpense(caseId, expenseId)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }
    return refreshCase(set, get, caseId)
  },

  addAttachment: async (caseId, input) => {
    const result = await apiCases.addAttachment(caseId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }
    return refreshCase(set, get, caseId)
  },

  deleteAttachment: async (caseId, attachmentId) => {
    const result = await apiCases.deleteAttachment(caseId, attachmentId)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }
    return refreshCase(set, get, caseId)
  },
}))
