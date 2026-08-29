import { fail, ok, readJson, withApiHandler } from '@/server/api'
import { requireRole, requireUser } from '@/server/auth/require-user'
import {
  parseVlessUri,
  testAndActivateVlessProxy,
  testVlessProxy,
} from '@/server/messenger/telegram/v2ray'
import * as settingsRepo from '@/server/repositories/settings-repo'

type TestBody = {
  /** If omitted, the stored config is tested. */
  config?: string
  /** Keep SOCKS5 process alive after a successful test (default true when saving path). */
  keepAlive?: boolean
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    requireRole(user, ['super_admin'])

    const body = (await readJson<TestBody>(request)) ?? {}
    let config = body.config?.trim() ?? ''

    if (!config) {
      const stored = await settingsRepo.getDecryptedTelegramProxyConfig()
      if (!stored) {
        return fail('کانفیگ V2Ray ذخیره نشده است. لینک vless:// را وارد کنید.')
      }
      config = stored
    }

    const parsed = parseVlessUri(config)
    if (!parsed.ok) {
      return fail(parsed.error)
    }

    const keepAlive = body.keepAlive === true
    const result = keepAlive
      ? await testAndActivateVlessProxy(config)
      : await testVlessProxy(config, { keepAlive: false })

    if (!result.ok) {
      return fail(result.error ?? 'تست کانفیگ ناموفق بود.')
    }

    return ok({
      socks: result.socks,
      latencyMs: result.latencyMs,
      remark: result.remark,
      running: keepAlive,
    })
  })
}
