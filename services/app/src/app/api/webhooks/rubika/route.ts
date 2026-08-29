import { NextResponse } from 'next/server'
import { readJson } from '@/server/api'
import * as settingsRepo from '@/server/repositories/settings-repo'
import { RUBIKA_CHATBOT_ENABLED } from '@/server/messenger/rubika/feature'
import { handleRubikaWebhookBody } from '@/server/messenger/rubika/router'

export const runtime = 'nodejs'

/**
 * Rubika Bot API webhook (ReceiveUpdate + ReceiveInlineMessage).
 * Auth via ?secret= on the URL registered with updateBotEndpoints.
 */
export async function POST(request: Request) {
  // Demo gate — acknowledge without processing so Rubika does not pause delivery.
  if (!RUBIKA_CHATBOT_ENABLED) {
    return NextResponse.json({ status: 'OK' })
  }

  try {
    const ready = await settingsRepo.isMessengerReady('rubika')
    if (!ready) {
      return new NextResponse(null, { status: 200 })
    }

    const url = new URL(request.url)
    const provided = url.searchParams.get('secret')
    const expected = await settingsRepo.getWebhookSecret('rubika')
    if (!settingsRepo.verifyWebhookSecret(expected, provided)) {
      return new NextResponse(null, { status: 401 })
    }

    const body = await readJson<unknown>(request)
    await handleRubikaWebhookBody(body)
    return NextResponse.json({ status: 'OK' })
  } catch (error) {
    console.error('[rubika-webhook]', error)
    // Always acknowledge so Rubika does not pause delivery.
    return NextResponse.json({ status: 'OK' })
  }
}
