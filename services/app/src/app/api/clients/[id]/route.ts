import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as clientsRepo from '@/server/repositories/clients-repo'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params

    const client = await clientsRepo.getClient(user.id, id)
    if (!client) return fail('Client not found', 404)
    return ok(client)
  })
}

export async function PATCH(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params
    const body = await readJson<Record<string, unknown>>(request)
    if (!body) return fail('Invalid JSON body')

    const client = await clientsRepo.updateClient(user.id, id, {
      name: typeof body.name === 'string' ? body.name : undefined,
      phone: typeof body.phone === 'string' ? body.phone : undefined,
      email: typeof body.email === 'string' ? body.email : undefined,
      citizenship:
        body.citizenship === 'iranian' || body.citizenship === 'foreign'
          ? body.citizenship
          : undefined,
      nationalId:
        typeof body.nationalId === 'string' ? body.nationalId : undefined,
      avatarDataUrl:
        body.avatarDataUrl === null || typeof body.avatarDataUrl === 'string'
          ? (body.avatarDataUrl as string | null)
          : undefined,
      notes: typeof body.notes === 'string' ? body.notes : undefined,
    })
    if (!client) return fail('Client not found', 404)
    return ok(client)
  })
}

export async function DELETE(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    const { id } = await ctx.params

    const deleted = await clientsRepo.deleteClient(user.id, id)
    if (!deleted) return fail('Client not found', 404)
    return ok({ deleted: true })
  })
}
