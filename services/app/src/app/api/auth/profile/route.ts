import { fail, ok, readJson, toPublicUser, withApiHandler } from '@/server/api'
import { requireUser } from '@/server/auth/require-user'
import { updateUserProfile } from '@/server/repositories/users-repo'

export async function PATCH(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const body = await readJson<{ name?: string }>(request)
    if (!body?.name?.trim()) return fail('name is required')

    const updated = await updateUserProfile(user.id, body.name)
    return ok({ user: toPublicUser(updated) })
  })
}
