import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import { validateMessengerToken } from '@/lib/messenger-token-validation'
import * as settingsRepo from '@/server/repositories/settings-repo'
import type { MessengerPlatform } from '@/server/repositories/settings-repo'

const PLATFORMS = new Set<MessengerPlatform>(['telegram', 'bale', 'rubika'])

type PatchBody = {
  platform?: string
  token?: string
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

    const token = body.token?.trim() ?? ''
    const validation = validateMessengerToken(platform, token)
    if (!validation.valid) {
      return fail(validation.message)
    }

    const status = await settingsRepo.upsertMessengerToken(
      platform,
      token,
      user.id
    )

    return ok({ messenger: status })
  })
}

export async function DELETE(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['super_admin'])

    const url = new URL(request.url)
    const platform = url.searchParams.get('platform') as MessengerPlatform
    if (!platform || !PLATFORMS.has(platform)) {
      return fail('پلتفرم پیام‌رسان نامعتبر است.')
    }

    const configured = await settingsRepo.isMessengerTokenConfigured(platform)
    if (!configured) {
      return fail('توکنی برای حذف وجود ندارد.')
    }

    const result = await settingsRepo.deleteMessengerToken(platform, user.id)
    return ok(result)
  })
}
