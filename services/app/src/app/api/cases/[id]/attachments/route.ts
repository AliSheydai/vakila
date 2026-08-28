import { fail, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'

type Ctx = { params: Promise<{ id: string }> }

/** Legacy metadata-only endpoint — use /init flow instead. */
export async function POST(request: Request, _ctx: Ctx) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['lawyer', 'super_admin'])
    return fail(
      'از مسیر init/complete برای آپلود فایل استفاده کنید.',
      410
    )
  })
}
