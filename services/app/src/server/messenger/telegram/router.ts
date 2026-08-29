import type { BotApiPlatform } from '@/server/messenger/bot-platforms'
import * as linksRepo from '@/server/repositories/messenger-links-repo'
import * as settingsRepo from '@/server/repositories/settings-repo'
import type { TelegramUpdate } from './api'
import { type BotContext, getBotToken, isLawyerRole } from './context'
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
 * Process a Bot API update for Telegram or Bale. Always safe to call; errors are logged.
 */
export async function handleBotUpdate(
  platform: BotApiPlatform,
  update: TelegramUpdate
): Promise<void> {
  const token = await getBotToken(platform)
  if (!token) return

  const ready = await settingsRepo.isMessengerReady(platform)
  if (!ready) return

  const message = update.message
  const callback = update.callback_query

  const chatId = String(
    message?.chat.id ?? callback?.message?.chat.id ?? callback?.from.id ?? ''
  )
  if (!chatId) return

  if (!allowRate(`${platform}:${chatId}`, 40, 60_000)) {
    return
  }

  const linked = await linksRepo.getActiveLinkByChat(platform, chatId)
  if (linked) {
    await linksRepo.touchLink(platform, chatId)
  }

  const ctx: BotContext = {
    platform,
    token,
    chatId,
    user: linked?.user ?? null,
  }

  const logTag = `[${platform}-bot]`

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
    console.error(`${logTag} handler error`, error)
    try {
      const { reply } = await import('./context')
      await reply(
        ctx,
        `خطایی رخ داد. دوباره از منوی اصلی تلاش کنید.`
      )
    } catch {
      // ignore
    }
  }
}

/** @deprecated Prefer handleBotUpdate('telegram', update) */
export async function handleTelegramUpdate(
  update: TelegramUpdate
): Promise<void> {
  return handleBotUpdate('telegram', update)
}

export async function handleBaleUpdate(
  update: TelegramUpdate
): Promise<void> {
  return handleBotUpdate('bale', update)
}
