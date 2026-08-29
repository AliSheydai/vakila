import * as linksRepo from '@/server/repositories/messenger-links-repo'
import * as settingsRepo from '@/server/repositories/settings-repo'
import { sendMessage } from '@/server/messenger/telegram/api'
import { esc, truncate } from '@/server/messenger/telegram/format'
import { cb, inlineKeyboard } from '@/server/messenger/telegram/keyboards'
import type { UserRole } from '@/server/types'
import { query } from '@/server/db'

/**
 * Push an in-app notification to Telegram when the recipient has a linked chat
 * and delivery rules allow it.
 */
export async function pushTelegramNotification(params: {
  recipientId: string
  title: string
  body: string
  caseId?: string | null
}): Promise<void> {
  try {
    const ready = await settingsRepo.isMessengerReady('telegram')
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
        delivery.clientChatbotPlatform !== 'telegram'
      ) {
        return
      }
    }
    // Lawyers / super_admin: push whenever linked (no extra channel gate)

    const link = await linksRepo.getActiveLinkByUser('telegram', params.recipientId)
    if (!link) return

    const token = await settingsRepo.getDecryptedMessengerToken('telegram')
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

    await sendMessage(token, link.chatId, text, { replyMarkup: markup })
  } catch (error) {
    console.error('[telegram-notify] push failed', error)
  }
}
