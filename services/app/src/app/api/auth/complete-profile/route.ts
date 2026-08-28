import { fail, ok, readJson, toPublicUser, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import { ensureCrmClientForPortalUser } from '@/server/repositories/clients-repo'
import { updateUserName } from '@/server/repositories/users-repo'

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const body = await readJson<{ name?: string }>(request)
    if (!body?.name?.trim()) return fail('name is required')

    const updated = await updateUserName(user.id, body.name)
    if (updated.role === 'client') {
      await ensureCrmClientForPortalUser(updated)
    }
    return ok({ user: toPublicUser(updated) })
  })
}
