import { api, type ApiResult } from '@/lib/api-client'
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from '../types'

export async function listClients(): Promise<ApiResult<Client[]>> {
  return api<Client[]>('/api/clients')
}

export async function getClient(
  clientId: string
): Promise<ApiResult<Client>> {
  return api<Client>(`/api/clients/${clientId}`)
}

export async function createClient(
  input: CreateClientInput
): Promise<ApiResult<Client>> {
  return api<Client>('/api/clients', { method: 'POST', body: input })
}

export async function updateClient(
  clientId: string,
  input: UpdateClientInput
): Promise<ApiResult<Client>> {
  return api<Client>(`/api/clients/${clientId}`, {
    method: 'PATCH',
    body: input,
  })
}

export async function deleteClient(
  clientId: string
): Promise<ApiResult<void>> {
  const result = await api<{ deleted: boolean }>(`/api/clients/${clientId}`, {
    method: 'DELETE',
  })
  if (!result.ok) return result
  return { ok: true, data: undefined }
}

/** Local helper — same as sync service. */
export function searchClients(clients: Client[], query: string): Client[] {
  const q = query.trim().toLowerCase()
  if (!q) return clients

  return clients.filter((client) => {
    const haystack = [client.name, client.phone, client.email ?? '']
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}
