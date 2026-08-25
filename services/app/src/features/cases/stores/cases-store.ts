import { create } from 'zustand'
import * as casesService from '../services/cases-service'
import * as clientsService from '../services/clients-service'
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
import { buildDemoCases, buildDemoClients } from '../utils/seed'

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

type CasesState = {
  ownerId: string | null
  cases: Case[]
  clients: Client[]
  hydrated: boolean
  error: string | null

  hydrate: (ownerId: string, options?: { seedIfEmpty?: boolean }) => ActionResult
  /** فقط اگر هیچ داده‌ای نباشد، دادهٔ نمونه می‌سازد */
  seedDemoIfEmpty: () => ActionResult
  reset: () => void

  addClient: (input: CreateClientInput) => ActionResult<Client>
  updateClient: (clientId: string, input: UpdateClientInput) => ActionResult<Client>
  deleteClient: (clientId: string) => ActionResult
  getClient: (clientId: string) => Client | null
  searchClients: (query: string) => Client[]
  getClientCases: (clientId: string) => Case[]

  addClientAttachment: (
    clientId: string,
    input: CreateAttachmentInput
  ) => ActionResult<Client>
  deleteClientAttachment: (
    clientId: string,
    attachmentId: string
  ) => ActionResult<Client>

  addCase: (input: CreateCaseInput) => ActionResult<Case>
  updateCase: (caseId: string, input: UpdateCaseInput) => ActionResult<Case>
  deleteCase: (caseId: string) => ActionResult
  getCase: (caseId: string) => Case | null

  upsertFee: (caseId: string, input: UpsertFeeInput) => ActionResult<Case>
  addPayment: (caseId: string, input: CreatePaymentInput) => ActionResult<Case>
  deletePayment: (caseId: string, paymentId: string) => ActionResult<Case>
  addExpense: (caseId: string, input: CreateExpenseInput) => ActionResult<Case>
  deleteExpense: (caseId: string, expenseId: string) => ActionResult<Case>
  addAttachment: (
    caseId: string,
    input: CreateAttachmentInput
  ) => ActionResult<Case>
  deleteAttachment: (
    caseId: string,
    attachmentId: string
  ) => ActionResult<Case>
}

function syncClientIntoState(
  set: (partial: Partial<CasesState>) => void,
  get: () => CasesState,
  updated: Client
) {
  set({
    clients: get().clients.map((item) =>
      item.id === updated.id ? updated : item
    ),
    error: null,
  })
}

function requireOwner(
  ownerId: string | null
): { ok: true; ownerId: string } | { ok: false; error: string } {
  if (!ownerId) {
    return { ok: false, error: 'کاربر مشخص نیست. ابتدا وارد شوید.' }
  }
  return { ok: true, ownerId }
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

function seedDemoData(
  ownerId: string
): ActionResult<{ cases: Case[]; clients: Client[] }> {
  const clients = buildDemoClients(ownerId)
  const cases = buildDemoCases(ownerId, clients)

  const clientsSaved = clientsService.replaceClients(ownerId, clients)
  if (!clientsSaved.ok) return clientsSaved

  const casesSaved = casesService.replaceCases(ownerId, cases)
  if (!casesSaved.ok) return casesSaved

  return { ok: true, data: { cases, clients } }
}

export const useCasesStore = create<CasesState>((set, get) => ({
  ownerId: null,
  cases: [],
  clients: [],
  hydrated: false,
  error: null,

  hydrate: (ownerId, options) => {
    const seedIfEmpty = options?.seedIfEmpty ?? false

    const casesResult = casesService.listCases(ownerId)
    const clientsResult = clientsService.listClients(ownerId)

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

    let cases = casesResult.data
    let clients = clientsResult.data

    if (seedIfEmpty && cases.length === 0 && clients.length === 0) {
      const seeded = seedDemoData(ownerId)
      if (seeded.ok) {
        cases = seeded.data.cases
        clients = seeded.data.clients
      }
    }

    set({
      ownerId,
      cases,
      clients,
      hydrated: true,
      error: null,
    })

    return { ok: true, data: undefined }
  },

  seedDemoIfEmpty: () => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    if (get().cases.length > 0 || get().clients.length > 0) {
      return {
        ok: false,
        error: 'داده‌ای از قبل وجود دارد؛ برای جلوگیری از بازنویسی seed انجام نشد.',
      }
    }

    const seeded = seedDemoData(gate.ownerId)
    if (!seeded.ok) {
      set({ error: seeded.error })
      return seeded
    }

    set({
      cases: seeded.data.cases,
      clients: seeded.data.clients,
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

  addClient: (input) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = clientsService.createClient(gate.ownerId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    set({
      clients: [...get().clients, result.data],
      error: null,
    })
    return result
  },

  updateClient: (clientId, input) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = clientsService.updateClient(gate.ownerId, clientId, input)
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

  deleteClient: (clientId) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const hasLinkedCases = get().cases.some(
      (item) => item.clientId === clientId
    )
    const result = clientsService.deleteClient(gate.ownerId, clientId, {
      hasLinkedCases,
    })
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

  searchClients: (query) =>
    clientsService.searchClients(get().clients, query),

  getClientCases: (clientId) => getCasesForClient(get().cases, clientId),

  addClientAttachment: (clientId, input) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = clientsService.addAttachment(
      gate.ownerId,
      clientId,
      input
    )
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    syncClientIntoState(set, get, result.data)
    return result
  },

  deleteClientAttachment: (clientId, attachmentId) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = clientsService.deleteAttachment(
      gate.ownerId,
      clientId,
      attachmentId
    )
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    syncClientIntoState(set, get, result.data)
    return result
  },

  addCase: (input) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = casesService.createCase(gate.ownerId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    set({
      cases: [...get().cases, result.data],
      error: null,
    })
    return result
  },

  updateCase: (caseId, input) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = casesService.updateCase(gate.ownerId, caseId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    syncCaseIntoState(set, get, result.data)
    return result
  },

  deleteCase: (caseId) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = casesService.deleteCase(gate.ownerId, caseId)
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

  upsertFee: (caseId, input) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = casesService.upsertFee(gate.ownerId, caseId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    syncCaseIntoState(set, get, result.data)
    return result
  },

  addPayment: (caseId, input) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = casesService.addPayment(gate.ownerId, caseId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    syncCaseIntoState(set, get, result.data)
    return result
  },

  deletePayment: (caseId, paymentId) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = casesService.deletePayment(gate.ownerId, caseId, paymentId)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    syncCaseIntoState(set, get, result.data)
    return result
  },

  addExpense: (caseId, input) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = casesService.addExpense(gate.ownerId, caseId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    syncCaseIntoState(set, get, result.data)
    return result
  },

  deleteExpense: (caseId, expenseId) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = casesService.deleteExpense(gate.ownerId, caseId, expenseId)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    syncCaseIntoState(set, get, result.data)
    return result
  },

  addAttachment: (caseId, input) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = casesService.addAttachment(gate.ownerId, caseId, input)
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    syncCaseIntoState(set, get, result.data)
    return result
  },

  deleteAttachment: (caseId, attachmentId) => {
    const gate = requireOwner(get().ownerId)
    if (!gate.ok) return { ok: false, error: gate.error }

    const result = casesService.deleteAttachment(
      gate.ownerId,
      caseId,
      attachmentId
    )
    if (!result.ok) {
      set({ error: result.error })
      return result
    }

    syncCaseIntoState(set, get, result.data)
    return result
  },
}))
