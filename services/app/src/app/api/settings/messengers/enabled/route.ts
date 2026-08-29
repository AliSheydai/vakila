import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import * as settingsRepo from '@/server/repositories/settings-repo'
import type { MessengerPlatform } from '@/server/repositories/settings-repo'

const PLATFORMS = new Set<MessengerPlatform>(['telegram', 'bale', 'rubika'])

type PatchBody = {
  platform?: string
  enabled?: boolean
}

export async function PATCH(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['super_admin'])

    const body = await readJson<PatchBody>(request)
    if (!body) {
      return fail('درخواست نامعتبر است.')
    }

    const platform = body.platform as MessengerPlatform
    if (!platform || !PLATFORMS.has(platform)) {
      return fail('پلتفرم پیام‌رسان نامعتبر است.')
    }

    if (typeof body.enabled !== 'boolean') {
      return fail('وضعیت فعال‌سازی نامعتبر است.')
    }

    try {
      const status = await settingsRepo.setMessengerEnabled(
        platform,
        body.enabled,
        user.id
      )
      return ok(status)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'فعال‌سازی چت‌بات ناموفق بود.'
      return fail(message)
    }
  })
}
