import type { User } from '@/server/types'
import type { MessengerPlatform } from '@/server/repositories/settings-repo'
import type { BotApiPlatform } from '@/server/messenger/bot-platforms'
import * as settingsRepo from '@/server/repositories/settings-repo'
import { stripHtml } from './format'
import {
  answerCallbackQuery,
  editMessageText,
  sendMessage,
  type TelegramReplyMarkup,
} from './api'
import * as rubikaApi from '@/server/messenger/rubika/api'
import { telegramMarkupToRubika } from '@/server/messenger/rubika/keyboards'
import { resolveRubikaMessageId } from '@/server/messenger/rubika/adapt'

export type BotContext = {
  platform: MessengerPlatform
  token: string
  chatId: string
  user: User | null
}

export async function getBotToken(
  platform: MessengerPlatform
): Promise<string | null> {
  const ready = await settingsRepo.isMessengerReady(platform)
  if (!ready) return null
  return settingsRepo.getDecryptedMessengerToken(platform)
}

/** @deprecated Prefer getBotToken('telegram') */
export async function getTelegramToken(): Promise<string | null> {
  return getBotToken('telegram')
}

async function replyRubika(
  ctx: BotContext,
  text: string,
  replyMarkup?: TelegramReplyMarkup
): Promise<void> {
  const plain = stripHtml(text)
  const keypad = telegramMarkupToRubika(replyMarkup)
  await rubikaApi.sendMessage(ctx.token, ctx.chatId, plain, keypad)
}

export async function reply(
  ctx: BotContext,
  text: string,
  replyMarkup?: TelegramReplyMarkup
): Promise<void> {
  if (ctx.platform === 'rubika') {
    await replyRubika(ctx, text, replyMarkup)
    return
  }
  await sendMessage(ctx.platform as BotApiPlatform, ctx.token, ctx.chatId, text, {
    replyMarkup,
  })
}

export async function editReply(
  ctx: BotContext,
  messageId: number,
  text: string,
  replyMarkup?: TelegramReplyMarkup
): Promise<void> {
  if (ctx.platform === 'rubika') {
    const plain = stripHtml(text)
    const realId = resolveRubikaMessageId(ctx.chatId, messageId)
    try {
      await rubikaApi.editMessageText(ctx.token, ctx.chatId, realId, plain)
      const keypad = telegramMarkupToRubika(replyMarkup)
      if (keypad.inlineKeypad) {
        await rubikaApi.editInlineKeypad(
          ctx.token,
          ctx.chatId,
          realId,
          keypad.inlineKeypad
        )
      }
    } catch {
      await replyRubika(ctx, text, replyMarkup)
    }
    return
  }

  try {
    await editMessageText(
      ctx.platform as BotApiPlatform,
      ctx.token,
      ctx.chatId,
      messageId,
      text,
      { replyMarkup }
    )
  } catch {
    await reply(ctx, text, replyMarkup)
  }
}

export async function ackCallback(
  ctx: BotContext,
  callbackQueryId: string,
  text?: string
): Promise<void> {
  if (ctx.platform === 'rubika') return
  try {
    await answerCallbackQuery(
      ctx.platform as BotApiPlatform,
      ctx.token,
      callbackQueryId,
      text
    )
  } catch {
    // ignore stale callbacks
  }
}

export function isLawyerRole(role: string): boolean {
  return role === 'lawyer' || role === 'super_admin'
}

export function displayName(user: User): string {
  return user.name?.trim() || user.phone
}
