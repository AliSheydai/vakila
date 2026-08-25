import {
  clientsCollectionSchema,
  type Client,
  type CreateClientInput,
  type UpdateClientInput,
} from '../types'
import { createId, nowIso } from '../utils/id'
import { readJson, writeJson } from './storage'

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function persist(ownerId: string, clients: Client[]): ServiceResult<Client[]> {
  const result = writeJson(ownerId, 'clients', clients)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, data: clients }
}

export function listClients(ownerId: string): ServiceResult<Client[]> {
  const raw = readJson<unknown>(ownerId, 'clients', [])

  if (!raw.ok) {
    return { ok: false, error: raw.error }
  }

  if (raw.empty) {
    return { ok: true, data: [] }
  }

  const parsed = clientsCollectionSchema.safeParse(raw.data)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'ساختار داده‌های موکل‌ها نامعتبر است.',
    }
  }

  return { ok: true, data: parsed.data }
}

export function getClient(
  ownerId: string,
  clientId: string
): ServiceResult<Client | null> {
  const list = listClients(ownerId)
  if (!list.ok) return list
  return {
    ok: true,
    data: list.data.find((client) => client.id === clientId) ?? null,
  }
}

export function createClient(
  ownerId: string,
  input: CreateClientInput
): ServiceResult<Client> {
  const list = listClients(ownerId)
  if (!list.ok) return list

  const timestamp = nowIso()
  const client: Client = {
    id: createId('client'),
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    ownerId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const next = [...list.data, client]
  const saved = persist(ownerId, next)
  if (!saved.ok) return saved

  return { ok: true, data: client }
}

export function updateClient(
  ownerId: string,
  clientId: string,
  input: UpdateClientInput
): ServiceResult<Client> {
  const list = listClients(ownerId)
  if (!list.ok) return list

  const index = list.data.findIndex((client) => client.id === clientId)
  if (index === -1) {
    return { ok: false, error: 'موکل یافت نشد.' }
  }

  const current = list.data[index]
  const updated: Client = {
    ...current,
    name: input.name !== undefined ? input.name.trim() : current.name,
    phone: input.phone !== undefined ? input.phone.trim() : current.phone,
    email:
      input.email !== undefined
        ? input.email.trim() || undefined
        : current.email,
    notes:
      input.notes !== undefined
        ? input.notes.trim() || undefined
        : current.notes,
    updatedAt: nowIso(),
  }

  const next = [...list.data]
  next[index] = updated

  const saved = persist(ownerId, next)
  if (!saved.ok) return saved

  return { ok: true, data: updated }
}

export function deleteClient(
  ownerId: string,
  clientId: string
): ServiceResult<{ id: string }> {
  const list = listClients(ownerId)
  if (!list.ok) return list

  if (!list.data.some((client) => client.id === clientId)) {
    return { ok: false, error: 'موکل یافت نشد.' }
  }

  const next = list.data.filter((client) => client.id !== clientId)
  const saved = persist(ownerId, next)
  if (!saved.ok) return saved

  return { ok: true, data: { id: clientId } }
}

export function replaceClients(
  ownerId: string,
  clients: Client[]
): ServiceResult<Client[]> {
  return persist(ownerId, clients)
}
