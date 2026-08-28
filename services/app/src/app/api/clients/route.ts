import { fail, ok, readJson, withApiHandler } from '@/server/api'
import {
  isLawyerRole,
  requireRole,
  requireUser,
} from '@/server/auth/require-user'
import * as clientsRepo from '@/server/repositories/clients-repo'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    if (!isLawyerRole(user.role)) return fail('Forbidden', 403)

    const clients = await clientsRepo.listClients(user.id)
    return ok(clients)
  })
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])

    const body = await readJson<{
      name?: string
      phone?: string
      email?: string
      citizenship?: 'iranian' | 'foreign'
      nationalId?: string
      avatarDataUrl?: string | null
      notes?: string
    }>(request)

    if (!body?.name?.trim() || !body?.phone?.trim()) {
      return fail('name and phone are required')
    }

    const client = await clientsRepo.createClient(user.id, {
      name: body.name,
      phone: body.phone,
      email: body.email,
      citizenship: body.citizenship,
      nationalId: body.nationalId,
      avatarDataUrl: body.avatarDataUrl,
      notes: body.notes,
    })
    return ok(client, { status: 201 })
  })
}
