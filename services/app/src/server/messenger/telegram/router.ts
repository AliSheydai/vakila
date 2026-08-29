import * as linksRepo from '@/server/repositories/messenger-links-repo'
import * as settingsRepo from '@/server/repositories/settings-repo'
import type { TelegramUpdate } from './api'
import { type BotContext, getTelegramToken, isLawyerRole } from './context'
import { tryDeepLinkLogin } from './deep-link-auth'
import { allowRate } from './rate-limit'
import {
  handleClientCallback,
  handleClientMessage,
  sendClientHome,
} from './handlers/client'
import {
  handleGuestMessage,
  sendWelcome,
} from './handlers/guest'
import {
  handleLawyerCallback,
  handleLawyerMessage,
  sendLawyerHome,
} from './handlers/lawyer'

/**
 * Process a Telegram update. Always safe to call; errors are logged.
 */
export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const token = await getTelegramToken()
  if (!token) return

  const ready = await settingsRepo.isMessengerReady('telegram')
  if (!ready) return

  const message = update.message
  const callback = update.callback_query

  const chatId = String(
    message?.chat.id ?? callback?.message?.chat.id ?? callback?.from.id ?? ''
  )
  if (!chatId) return

  if (!allowRate(`tg:${chatId}`, 40, 60_000)) {
    return
  }

  const linked = await linksRepo.getActiveLinkByChat('telegram', chatId)
  if (linked) {
    await linksRepo.touchLink('telegram', chatId)
  }

  const ctx: BotContext = {
    token,
    chatId,
    user: linked?.user ?? null,
  }

  try {
    if (callback) {
      if (!ctx.user) {
        await sendWelcome(ctx, null)
        return
      }
      if (isLawyerRole(ctx.user.role)) {
        const handled = await handleLawyerCallback(ctx, ctx.user, callback)
        if (!handled) await sendLawyerHome(ctx, ctx.user)
      } else {
        const handled = await handleClientCallback(ctx, ctx.user, callback)
        if (!handled) await sendClientHome(ctx, ctx.user)
      }
      return
    }

    if (message) {
      const text = message.text?.trim() ?? ''

      // Dashboard deep-link: /start <signed-payload> — works even if already linked
      if (/^\/start(?:@\w+)?\s+\S+/i.test(text)) {
        const result = await tryDeepLinkLogin(ctx, text)
        if (result === 'linked' || result === 'invalid') return
        // 'none' should not happen when regex matched a payload
      }

      if (!ctx.user) {
        await handleGuestMessage(ctx, message)
        return
      }

      if (text === '/start') {
        if (isLawyerRole(ctx.user.role)) await sendLawyerHome(ctx, ctx.user)
        else await sendClientHome(ctx, ctx.user)
        return
      }

      if (isLawyerRole(ctx.user.role)) {
        await handleLawyerMessage(ctx, ctx.user, message)
      } else {
        await handleClientMessage(ctx, ctx.user, message)
      }
    }
  } catch (error) {
    console.error('[telegram-bot] handler error', error)
    try {
      const { reply } = await import('./context')
      await reply(
        ctx,
        'خطایی رخ داد. دوباره از منوی اصلی تلاش کنید.'
      )
    } catch {
      // ignore
    }
  }
}
