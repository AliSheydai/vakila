import { fail, ok, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import { getPortalData } from '@/server/repositories/portal-repo'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['client'])
    const data = await getPortalData(user)
    return ok(data)
  })
}
