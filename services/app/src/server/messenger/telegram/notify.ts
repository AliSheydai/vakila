import type { BotApiPlatform } from '@/server/messenger/bot-platforms'
import * as linksRepo from '@/server/repositories/messenger-links-repo'
import * as settingsRepo from '@/server/repositories/settings-repo'
import { sendMessage } from '@/server/messenger/telegram/api'
import { esc, truncate } from '@/server/messenger/telegram/format'
import { cb, inlineKeyboard } from '@/server/messenger/telegram/keyboards'
import type { UserRole } from '@/server/types'
import { query } from '@/server/db'

/**
 * Push an in-app notification to a linked Telegram/Bale chat when delivery rules allow it.
 */
export async function pushBotNotification(
  platform: BotApiPlatform,
  params: {
    recipientId: string
    title: string
    body: string
    caseId?: string | null
  }
): Promise<void> {
  try {
    const ready = await settingsRepo.isMessengerReady(platform)
    if (!ready) return

    const { rows } = await query<{ role: UserRole }>(
      `SELECT role FROM users WHERE id = $1 AND is_active = TRUE LIMIT 1`,
      [params.recipientId]
    )
    const role = rows[0]?.role
    if (!role) return

    if (role === 'client') {
      const delivery = await settingsRepo.getNotificationDeliverySettings()
      if (
        delivery.clientChannel !== 'chatbot' ||
        delivery.clientChatbotPlatform !== platform
      ) {
        return
      }
    }
    // Lawyers / super_admin: push whenever linked (no extra channel gate)

    const link = await linksRepo.getActiveLinkByUser(
      platform,
      params.recipientId
    )
    if (!link) return

    const token = await settingsRepo.getDecryptedMessengerToken(platform)
    if (!token) return

    const text =
      `<b>${esc(params.title)}</b>\n${esc(truncate(params.body, 500))}`

    const markup = params.caseId
      ? inlineKeyboard([
          [
            {
              text: 'مشاهده در بات',
              callback_data: cb(role === 'client' ? 'cc' : 'lc', params.caseId),
            },
          ],
        ])
      : undefined

    await sendMessage(platform, token, link.chatId, text, {
      replyMarkup: markup,
    })
  } catch (error) {
    console.error(`[${platform}-notify] push failed`, error)
  }
}

export async function pushTelegramNotification(params: {
  recipientId: string
  title: string
  body: string
  caseId?: string | null
}): Promise<void> {
  return pushBotNotification('telegram', params)
}

export async function pushBaleNotification(params: {
  recipientId: string
  title: string
  body: string
  caseId?: string | null
}): Promise<void> {
  return pushBotNotification('bale', params)
}

/**
 * Push to whichever chatbot platforms the recipient may be linked on,
 * respecting client delivery settings for clients.
 */
export async function pushMessengerNotifications(params: {
  recipientId: string
  title: string
  body: string
  caseId?: string | null
}): Promise<void> {
  await Promise.all([
    pushBotNotification('telegram', params),
    pushBotNotification('bale', params),
  ])
}
