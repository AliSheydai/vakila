import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import { parseVlessUri } from '@/server/messenger/telegram/v2ray'
import * as settingsRepo from '@/server/repositories/settings-repo'

type PatchBody = {
  config?: string
  /** When true (default), test & activate SOCKS5 before saving. */
  activate?: boolean
}

export async function PATCH(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['super_admin'])

    const body = await readJson<PatchBody>(request)
    if (!body) {
      return fail('درخواست نامعتبر است.')
    }

    const config = body.config?.trim() ?? ''
    const parsed = parseVlessUri(config)
    if (!parsed.ok) {
      return fail(parsed.error)
    }

    const messenger = await settingsRepo.upsertTelegramProxyConfig(
      config,
      user.id,
      { activate: body.activate !== false }
    )

    return ok({ messenger })
  })
}

export async function DELETE(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['super_admin'])

    const messenger = await settingsRepo.deleteTelegramProxyConfig(user.id)
    return ok({ messenger })
  })
}
