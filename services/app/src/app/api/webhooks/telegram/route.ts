import { NextResponse } from 'next/server'
import { readJson } from '@/server/api'
import * as settingsRepo from '@/server/repositories/settings-repo'
import type { TelegramUpdate } from '@/server/messenger/telegram/api'
import { handleTelegramUpdate } from '@/server/messenger/telegram/router'

export const runtime = 'nodejs'

/**
 * Telegram Bot API webhook. Authenticated via X-Telegram-Bot-Api-Secret-Token.
 */
export async function POST(request: Request) {
  try {
    const ready = await settingsRepo.isMessengerReady('telegram')
    if (!ready) {
      return new NextResponse(null, { status: 200 })
    }

    const provided = request.headers.get('x-telegram-bot-api-secret-token')
    const expected = await settingsRepo.getWebhookSecret('telegram')
    if (!settingsRepo.verifyWebhookSecret(expected, provided)) {
      return new NextResponse(null, { status: 401 })
    }

    const update = await readJson<TelegramUpdate>(request)
    if (!update || typeof update.update_id !== 'number') {
      return new NextResponse(null, { status: 200 })
    }

    await handleTelegramUpdate(update)
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('[telegram-webhook]', error)
    return new NextResponse(null, { status: 200 })
  }
}
