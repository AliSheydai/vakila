import { fail, ok, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import { revokeSessionById } from '@/server/repositories/sessions-repo'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const { id } = await context.params
    if (!id) return fail('Session id is required')

    const revoked = await revokeSessionById(user.id, id)
    if (!revoked) return fail('Session not found', 404)

    return ok({ revoked: true })
  })
}
