import { NextResponse } from 'next/server'
import { readJson } from '@/server/api'
import * as settingsRepo from '@/server/repositories/settings-repo'
import type { TelegramUpdate } from '@/server/messenger/telegram/api'
import { handleBaleUpdate } from '@/server/messenger/telegram/router'

export const runtime = 'nodejs'

/**
 * Bale Bot API webhook.
 * Bale does not document secret_token headers — auth is via ?secret= on the URL
 * registered at setWebhook time.
 */
export async function POST(request: Request) {
  try {
    const ready = await settingsRepo.isMessengerReady('bale')
    if (!ready) {
      return new NextResponse(null, { status: 200 })
    }

    const url = new URL(request.url)
    const provided =
      url.searchParams.get('secret') ??
      request.headers.get('x-telegram-bot-api-secret-token')
    const expected = await settingsRepo.getWebhookSecret('bale')
    if (!settingsRepo.verifyWebhookSecret(expected, provided)) {
      return new NextResponse(null, { status: 401 })
    }

    const update = await readJson<TelegramUpdate>(request)
    if (!update || typeof update.update_id !== 'number') {
      return new NextResponse(null, { status: 200 })
    }

    await handleBaleUpdate(update)
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('[bale-webhook]', error)
    return new NextResponse(null, { status: 200 })
  }
}
