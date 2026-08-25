import {
  clientsCollectionSchema,
  type Attachment,
  type Client,
  type CreateAttachmentInput,
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

function touch(client: Client): Client {
  return { ...client, updatedAt: nowIso() }
}

function updateClientById(
  ownerId: string,
  clientId: string,
  updater: (current: Client) => Client | ServiceResult<never>
): ServiceResult<Client> {
  const list = listClients(ownerId)
  if (!list.ok) return list

  const index = list.data.findIndex((client) => client.id === clientId)
  if (index === -1) {
    return { ok: false, error: 'موکل یافت نشد.' }
  }

  const result = updater(list.data[index])
  if (typeof result === 'object' && result !== null && 'ok' in result) {
    return result
  }

  const updated = touch(result)
  const next = [...list.data]
  next[index] = updated

  const saved = persist(ownerId, next)
  if (!saved.ok) return saved

  return { ok: true, data: updated }
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

/**
 * جستجوی ساده روی نام، موبایل و ایمیل — بدون وابستگی به UI.
 */
export function searchClients(
  clients: Client[],
  query: string
): Client[] {
  const q = query.trim().toLowerCase()
  if (!q) return clients

  return clients.filter((client) => {
    const haystack = [
      client.name,
      client.phone,
      client.email ?? '',
      client.nationalId ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(q)
  })
}

export function createClient(
  ownerId: string,
  input: CreateClientInput
): ServiceResult<Client> {
  const list = listClients(ownerId)
  if (!list.ok) return list

  const name = input.name.trim()
  const phone = input.phone.trim()

  if (!name) {
    return { ok: false, error: 'نام موکل الزامی است.' }
  }
  if (!phone) {
    return { ok: false, error: 'شماره موبایل الزامی است.' }
  }

  const timestamp = nowIso()
  const client: Client = {
    id: createId('client'),
    name,
    phone,
    email: input.email?.trim() || undefined,
    nationalId: input.nationalId?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    attachments: [],
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
  return updateClientById(ownerId, clientId, (current) => {
    if (input.name !== undefined && !input.name.trim()) {
      return { ok: false, error: 'نام موکل الزامی است.' }
    }
    if (input.phone !== undefined && !input.phone.trim()) {
      return { ok: false, error: 'شماره موبایل الزامی است.' }
    }

    return {
      ...current,
      name: input.name !== undefined ? input.name.trim() : current.name,
      phone: input.phone !== undefined ? input.phone.trim() : current.phone,
      email:
        input.email !== undefined
          ? input.email.trim() || undefined
          : current.email,
      nationalId:
        input.nationalId !== undefined
          ? input.nationalId.trim() || undefined
          : current.nationalId,
      notes:
        input.notes !== undefined
          ? input.notes.trim() || undefined
          : current.notes,
    }
  })
}

/**
 * حذف موکل.
 * اگر `hasLinkedCases` true باشد حذف مسدود می‌شود (پرونده‌ها حذف نمی‌شوند).
 */
export function deleteClient(
  ownerId: string,
  clientId: string,
  options?: { hasLinkedCases?: boolean }
): ServiceResult<{ id: string }> {
  if (options?.hasLinkedCases) {
    return {
      ok: false,
      error: 'این موکل به پرونده‌ای متصل است و قابل حذف نیست.',
    }
  }

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

export function addAttachment(
  ownerId: string,
  clientId: string,
  input: CreateAttachmentInput
): ServiceResult<Client> {
  return updateClientById(ownerId, clientId, (current) => {
    const attachment: Attachment = {
      id: createId('att'),
      name: input.name.trim(),
      mimeType: input.mimeType,
      size: input.size,
      uploadedAt: nowIso(),
      uploadedBy: input.uploadedBy,
    }
    return {
      ...current,
      attachments: [...(current.attachments ?? []), attachment],
    }
  })
}

export function deleteAttachment(
  ownerId: string,
  clientId: string,
  attachmentId: string
): ServiceResult<Client> {
  return updateClientById(ownerId, clientId, (current) => {
    const attachments = current.attachments ?? []
    if (!attachments.some((item) => item.id === attachmentId)) {
      return { ok: false, error: 'پیوست یافت نشد.' }
    }
    return {
      ...current,
      attachments: attachments.filter((item) => item.id !== attachmentId),
    }
  })
}

export function replaceClients(
  ownerId: string,
  clients: Client[]
): ServiceResult<Client[]> {
  return persist(ownerId, clients)
}
