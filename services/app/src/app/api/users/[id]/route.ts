import { fail, ok, readJson, sanitizeError, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import { updateUserRole } from '@/server/repositories/users-repo'
import type { UserRole } from '@/server/types'

type Ctx = { params: Promise<{ id: string }> }

const ROLES: UserRole[] = ['super_admin', 'lawyer', 'client']

export async function PATCH(request: Request, ctx: Ctx) {
  return withApiHandler(async () => {
    const actor = await requireUser(request)
    requireRole(actor, ['super_admin'])
    const { id } = await ctx.params

    const body = await readJson<{ role?: UserRole }>(request)
    if (!body?.role || !ROLES.includes(body.role)) {
      return fail('Valid role is required')
    }

    try {
      const updated = await updateUserRole(actor.id, id, body.role)
      return ok(updated)
    } catch (error) {
      return fail(sanitizeError(error, 'Unable to update user'), 400)
    }
  })
}
