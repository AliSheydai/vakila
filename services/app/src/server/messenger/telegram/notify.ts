import type { BotApiPlatform } from '@/server/messenger/bot-platforms'
import type { MessengerPlatform } from '@/server/repositories/settings-repo'
import * as linksRepo from '@/server/repositories/messenger-links-repo'
import * as settingsRepo from '@/server/repositories/settings-repo'
import { sendMessage } from '@/server/messenger/telegram/api'
import * as rubikaApi from '@/server/messenger/rubika/api'
import { telegramMarkupToRubika } from '@/server/messenger/rubika/keyboards'
import { esc, stripHtml, truncate } from '@/server/messenger/telegram/format'
import { cb, inlineKeyboard } from '@/server/messenger/telegram/keyboards'
import type { UserRole } from '@/server/types'
import { query } from '@/server/db'

export type PushMessengerParams = {
  recipientId: string
  title: string
  body: string
  caseId?: string | null
  /** Actor who triggered the in-app notification (used for client→lawyer chatbot prefs). */
  actorId?: string | null
}

/**
 * Resolve which messenger platforms (if any) may receive a chatbot push
 * for this recipient, based on bidirectional opt-in rules.
 *
 * - client recipient → admin `notification_delivery_settings`
 * - lawyer / super_admin recipient → actor's `user_notification_preferences`
 */
export async function resolveChatbotPlatforms(params: {
  recipientId: string
  actorId?: string | null
}): Promise<{ platforms: MessengerPlatform[]; role: UserRole } | null> {
  const { rows } = await query<{ role: UserRole }>(
    `SELECT role FROM users WHERE id = $1 AND is_active = TRUE LIMIT 1`,
    [params.recipientId]
  )
  const role = rows[0]?.role
  if (!role) return null

  if (role === 'client') {
    const delivery = await settingsRepo.getNotificationDeliverySettings()
    if (
      delivery.clientChannel !== 'chatbot' ||
      delivery.clientChatbotPlatforms.length === 0
    ) {
      return null
    }
    return { platforms: delivery.clientChatbotPlatforms, role }
  }

  // Lawyer / super_admin: only when the acting client opted into chatbot notify-to-lawyer
  if (!params.actorId) return null

  const prefs = await settingsRepo.getUserNotificationPreferences(params.actorId)
  if (prefs.channel !== 'chatbot' || prefs.chatbotPlatforms.length === 0) {
    return null
  }
  return { platforms: prefs.chatbotPlatforms, role }
}

/** @deprecated Use resolveChatbotPlatforms */
export async function resolveChatbotPlatform(params: {
  recipientId: string
  actorId?: string | null
}): Promise<{ platform: MessengerPlatform; role: UserRole } | null> {
  const resolved = await resolveChatbotPlatforms(params)
  if (!resolved?.platforms[0]) return null
  return { platform: resolved.platforms[0], role: resolved.role }
}

/**
 * Push an in-app notification to a linked messenger chat when delivery rules allow it.
 */
export async function pushBotNotification(
  platform: MessengerPlatform,
  params: PushMessengerParams & { role: UserRole }
): Promise<void> {
  try {
    const ready = await settingsRepo.isMessengerReady(platform)
    if (!ready) return

    const link = await linksRepo.getActiveLinkByUser(
      platform,
      params.recipientId
    )
    if (!link) return

    const token = await settingsRepo.getDecryptedMessengerToken(platform)
    if (!token) return

    const html =
      `<b>${esc(params.title)}</b>\n${esc(truncate(params.body, 500))}`

    const markup = params.caseId
      ? inlineKeyboard([
          [
            {
              text: 'مشاهده در بات',
              callback_data: cb(
                params.role === 'client' ? 'cc' : 'lc',
                params.caseId
              ),
            },
          ],
        ])
      : undefined

    if (platform === 'rubika') {
      await rubikaApi.sendMessage(
        token,
        link.chatId,
        stripHtml(html),
        telegramMarkupToRubika(markup)
      )
      return
    }

    await sendMessage(platform as BotApiPlatform, token, link.chatId, html, {
      replyMarkup: markup,
    })
  } catch (error) {
    console.error(`[${platform}-notify] push failed`, error)
  }
}

export async function pushTelegramNotification(
  params: PushMessengerParams
): Promise<void> {
  return pushMessengerNotifications(params)
}

export async function pushBaleNotification(
  params: PushMessengerParams
): Promise<void> {
  return pushMessengerNotifications(params)
}

export async function pushRubikaNotification(
  params: PushMessengerParams
): Promise<void> {
  return pushMessengerNotifications(params)
}

/**
 * Push to all opted-in chatbot platforms when rules allow it.
 * Per platform: skips if messenger not ready or recipient has no active link.
 */
export async function pushMessengerNotifications(
  params: PushMessengerParams
): Promise<void> {
  const resolved = await resolveChatbotPlatforms({
    recipientId: params.recipientId,
    actorId: params.actorId,
  })
  if (!resolved) return

  await Promise.all(
    resolved.platforms.map((platform) =>
      pushBotNotification(platform, {
        ...params,
        role: resolved.role,
      })
    )
  )
}
