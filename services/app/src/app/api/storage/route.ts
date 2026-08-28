import { ok, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import {
  getPerUserStorageUsage,
  getStorageUsageSummary,
  listStorageFiles,
} from '@/server/storage/quota'

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])

    const ownerFilter =
      user.role === 'lawyer' ? user.id : undefined

    const [summary, byUser, files] = await Promise.all([
      getStorageUsageSummary(),
      getPerUserStorageUsage(),
      listStorageFiles(ownerFilter),
    ])

    return ok({ summary, byUser, files })
  })
}
