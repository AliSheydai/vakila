import type { TelegramUpdate } from '@/server/messenger/telegram/api'
import * as linksRepo from '@/server/repositories/messenger-links-repo'
import * as settingsRepo from '@/server/repositories/settings-repo'
import {
  type BotContext,
  getBotToken,
  isLawyerRole,
  reply,
} from '@/server/messenger/telegram/context'
import { tryDeepLinkLogin } from '@/server/messenger/telegram/deep-link-auth'
import { allowRate } from '@/server/messenger/telegram/rate-limit'
import {
  handleClientCallback,
  handleClientMessage,
  sendClientHome,
} from '@/server/messenger/telegram/handlers/client'
import {
  handleGuestMessage,
  sendWelcome,
} from '@/server/messenger/telegram/handlers/guest'
import {
  handleLawyerCallback,
  handleLawyerMessage,
  sendLawyerHome,
} from '@/server/messenger/telegram/handlers/lawyer'
import type { RubikaInlineMessage, RubikaUpdate } from './api'
import { rubikaInlineToTelegram, rubikaUpdateToTelegram } from './adapt'

async function processAdaptedUpdate(
  chatId: string,
  telegram: TelegramUpdate
): Promise<void> {
  const token = await getBotToken('rubika')
  if (!token) return

  const ready = await settingsRepo.isMessengerReady('rubika')
  if (!ready) return

  if (!allowRate(`rubika:${chatId}`, 40, 60_000)) return

  const linked = await linksRepo.getActiveLinkByChat('rubika', chatId)
  if (linked) await linksRepo.touchLink('rubika', chatId)

  const ctx: BotContext = {
    platform: 'rubika',
    token,
    chatId,
    user: linked?.user ?? null,
  }

  try {
    if (telegram.callback_query) {
      if (!ctx.user) {
        await sendWelcome(ctx, null)
        return
      }
      if (isLawyerRole(ctx.user.role)) {
        const handled = await handleLawyerCallback(
          ctx,
          ctx.user,
          telegram.callback_query
        )
        if (!handled) await sendLawyerHome(ctx, ctx.user)
      } else {
        const handled = await handleClientCallback(
          ctx,
          ctx.user,
          telegram.callback_query
        )
        if (!handled) await sendClientHome(ctx, ctx.user)
      }
      return
    }

    if (telegram.message) {
      const text = telegram.message.text?.trim() ?? ''

      if (/^\/start(?:@\w+)?\s+\S+/i.test(text)) {
        const result = await tryDeepLinkLogin(ctx, text)
        if (result === 'linked' || result === 'invalid') return
      }

      if (!ctx.user) {
        await handleGuestMessage(ctx, telegram.message)
        return
      }

      if (text === '/start') {
        if (isLawyerRole(ctx.user.role)) await sendLawyerHome(ctx, ctx.user)
        else await sendClientHome(ctx, ctx.user)
        return
      }

      if (isLawyerRole(ctx.user.role)) {
        await handleLawyerMessage(ctx, ctx.user, telegram.message)
      } else {
        await handleClientMessage(ctx, ctx.user, telegram.message)
      }
    }
  } catch (error) {
    console.error('[rubika-bot] handler error', error)
    try {
      await reply(ctx, 'خطایی رخ داد. دوباره از منوی اصلی تلاش کنید.')
    } catch {
      // ignore
    }
  }
}

export async function handleRubikaUpdate(update: RubikaUpdate): Promise<void> {
  const adapted = rubikaUpdateToTelegram(update)
  if (!adapted) return
  await processAdaptedUpdate(adapted.chatId, adapted.telegram)
}

export async function handleRubikaInlineMessage(
  inline: RubikaInlineMessage
): Promise<void> {
  const adapted = rubikaInlineToTelegram(inline)
  if (!adapted) return
  await processAdaptedUpdate(adapted.chatId, adapted.telegram)
}

export async function handleRubikaWebhookBody(body: unknown): Promise<void> {
  if (!body || typeof body !== 'object') return
  const record = body as Record<string, unknown>

  if (record.update && typeof record.update === 'object') {
    await handleRubikaUpdate(record.update as RubikaUpdate)
    return
  }

  if (record.inline_message && typeof record.inline_message === 'object') {
    await handleRubikaInlineMessage(
      record.inline_message as RubikaInlineMessage
    )
  }
}
