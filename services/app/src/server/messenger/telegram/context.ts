import type { User } from '@/server/types'
import * as settingsRepo from '@/server/repositories/settings-repo'
import {
  answerCallbackQuery,
  editMessageText,
  sendMessage,
  type TelegramReplyMarkup,
} from './api'

export type BotContext = {
  token: string
  chatId: string
  user: User | null
}

export async function getTelegramToken(): Promise<string | null> {
  const ready = await settingsRepo.isMessengerReady('telegram')
  if (!ready) return null
  return settingsRepo.getDecryptedMessengerToken('telegram')
}

export async function reply(
  ctx: BotContext,
  text: string,
  replyMarkup?: TelegramReplyMarkup
): Promise<void> {
  await sendMessage(ctx.token, ctx.chatId, text, { replyMarkup })
}

export async function editReply(
  ctx: BotContext,
  messageId: number,
  text: string,
  replyMarkup?: TelegramReplyMarkup
): Promise<void> {
  try {
    await editMessageText(ctx.token, ctx.chatId, messageId, text, {
      replyMarkup,
    })
  } catch {
    await reply(ctx, text, replyMarkup)
  }
}

export async function ackCallback(
  ctx: BotContext,
  callbackQueryId: string,
  text?: string
): Promise<void> {
  try {
    await answerCallbackQuery(ctx.token, callbackQueryId, text)
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
