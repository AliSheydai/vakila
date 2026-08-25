import type {
  Case,
  CaseStatus,
  Client,
  ClientCaseActivityFilter,
  ClientSortOption,
} from '../types'
import { searchClients as searchClientsInList } from '../services/clients-service'

/** وضعیت‌هایی که «پرونده فعال» محسوب می‌شوند */
export const ACTIVE_CASE_STATUSES: readonly CaseStatus[] = [
  'new',
  'under_review',
  'active',
  'awaiting_action',
] as const

export function isActiveCaseStatus(status: CaseStatus): boolean {
  return ACTIVE_CASE_STATUSES.includes(status)
}

export function getCasesForClient(cases: Case[], clientId: string): Case[] {
  return cases.filter((item) => item.clientId === clientId)
}

export function clientHasActiveCase(cases: Case[], clientId: string): boolean {
  return getCasesForClient(cases, clientId).some((item) =>
    isActiveCaseStatus(item.status)
  )
}

export function getClientCaseCount(cases: Case[], clientId: string): number {
  return getCasesForClient(cases, clientId).length
}

export type ClientListOptions = {
  query?: string
  activity?: ClientCaseActivityFilter
  sort?: ClientSortOption
}

/**
 * فیلتر / جستجو / مرتب‌سازی لیست موکل‌ها برای UI.
 * منطق در لایهٔ دامنه می‌ماند تا جدول و موبایل یکسان بمانند.
 */
export function filterAndSortClients(
  clients: Client[],
  cases: Case[],
  options: ClientListOptions = {}
): Client[] {
  const {
    query = '',
    activity = 'all',
    sort = 'newest',
  } = options

  let result = searchClientsInList(clients, query)

  if (activity === 'with_active_case') {
    result = result.filter((client) => clientHasActiveCase(cases, client.id))
  } else if (activity === 'without_active_case') {
    result = result.filter((client) => !clientHasActiveCase(cases, client.id))
  }

  const sorted = [...result]
  switch (sort) {
    case 'oldest':
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      break
    case 'name_asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'fa'))
      break
    case 'newest':
    default:
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      break
  }

  return sorted
}

export type ClientsSummary = {
  total: number
  withActiveCase: number
  withoutCase: number
}

export function summarizeClients(
  clients: Client[],
  cases: Case[]
): ClientsSummary {
  let withActiveCase = 0
  let withoutCase = 0

  for (const client of clients) {
    const linked = getCasesForClient(cases, client.id)
    if (linked.length === 0) {
      withoutCase += 1
    }
    if (linked.some((item) => isActiveCaseStatus(item.status))) {
      withActiveCase += 1
    }
  }

  return {
    total: clients.length,
    withActiveCase,
    withoutCase,
  }
}
