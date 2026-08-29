import type {
  TelegramCallbackQuery,
  TelegramMessage,
  TelegramUpdate,
} from '@/server/messenger/telegram/api'
import type { RubikaInlineMessage, RubikaMessage, RubikaUpdate } from './api'

/** Decode and normalize Rubika aux_data.start_id from ?st= deep links. */
function normalizeStartId(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null
  let value = String(raw).trim()
  if (!value || value === 'null' || value === 'undefined') return null
  try {
    value = decodeURIComponent(value)
  } catch {
    // already plain
  }
  value = value.trim()
  return value || null
}

function toMessageId(id: string | number | undefined): number {
  if (id === undefined || id === null) return 0
  const asString = String(id)
  // Keep as much uniqueness as possible within JS safe integer range for edit paths.
  // Rubika IDs are long strings; handlers only need a stable handle for editReply.
  if (/^\d+$/.test(asString) && asString.length <= 15) {
    return Number(asString)
  }
  let hash = 0
  for (let i = 0; i < asString.length; i++) {
    hash = (hash * 31 + asString.charCodeAt(i)) | 0
  }
  return Math.abs(hash) || 1
}

/** Preserve raw Rubika message_id for the Rubika send/edit path. */
export type RubikaMessageMeta = {
  rubikaMessageId: string
}

const messageIdMap = new Map<string, string>()

export function rememberRubikaMessageId(
  chatId: string,
  syntheticId: number,
  realId: string
): void {
  messageIdMap.set(`${chatId}:${syntheticId}`, realId)
}

export function resolveRubikaMessageId(
  chatId: string,
  syntheticOrReal: string | number
): string {
  const key = `${chatId}:${syntheticOrReal}`
  return messageIdMap.get(key) ?? String(syntheticOrReal)
}

function toTelegramMessage(
  chatId: string,
  msg: RubikaMessage
): TelegramMessage & RubikaMessageMeta {
  const rubikaMessageId = String(msg.message_id)
  const messageId = toMessageId(msg.message_id)
  rememberRubikaMessageId(chatId, messageId, rubikaMessageId)

  const time =
    typeof msg.time === 'number'
      ? msg.time
      : Number.parseInt(String(msg.time ?? '0'), 10) ||
        Math.floor(Date.now() / 1000)

  return {
    message_id: messageId,
    rubikaMessageId,
    date: time,
    chat: { id: 0, type: 'private' },
    from: msg.sender_id
      ? {
          id: 0,
          is_bot: false,
          first_name: 'User',
          username: msg.sender_id,
        }
      : undefined,
    text: msg.text,
    contact: msg.contact_message?.phone_number
      ? {
          phone_number: msg.contact_message.phone_number,
          first_name: msg.contact_message.first_name ?? '',
          user_id: undefined,
        }
      : undefined,
  }
}

/**
 * Map a Rubika Update into a Telegram-shaped update for shared handlers.
 * Chat id stays in a side channel via the router (string chat ids).
 */
export function rubikaUpdateToTelegram(
  update: RubikaUpdate
): {
  telegram: TelegramUpdate
  chatId: string
  startId: string | null
  buttonId: string | null
} | null {
  const chatId = update.chat_id
  if (!chatId) return null

  if (update.type === 'StartedBot') {
    const startId = normalizeStartId(update.new_message?.aux_data?.start_id)
    const text = startId ? `/start ${startId}` : '/start'
    const msg = update.new_message ?? {
      message_id: `start-${Date.now()}`,
      text,
      sender_id: undefined,
    }
    return {
      telegram: {
        update_id: Date.now(),
        message: toTelegramMessage(chatId, { ...msg, text }),
      },
      chatId,
      startId,
      buttonId: null,
    }
  }

  if (update.type === 'NewMessage' && update.new_message) {
    const msg = update.new_message
    const startId = normalizeStartId(msg.aux_data?.start_id)
    const buttonId = msg.aux_data?.button_id
      ? String(msg.aux_data.button_id)
      : null

    // Chat keypad Simple click → treat as text message (handlers match BTN labels).
    // If button_id looks like callback_data (contains ':'), route as callback instead.
    // Deep-link start_id wins over button routing — opening via ?st= must always login.
    if (buttonId && buttonId.includes(':') && !startId) {
      const base = toTelegramMessage(chatId, msg)
      const callback: TelegramCallbackQuery = {
        id: `rk-${buttonId}-${msg.message_id}`,
        from: base.from ?? { id: 0, is_bot: false, first_name: 'User' },
        message: base,
        data: buttonId,
        chat_instance: chatId,
      }
      return {
        telegram: { update_id: Date.now(), callback_query: callback },
        chatId,
        startId,
        buttonId,
      }
    }

    // Rubika often sends start_message text alongside aux_data.start_id when the
    // user opens https://rubika.ir/{bot}?st=... — always prefer the deep-link payload.
    const text = startId ? `/start ${startId}` : (msg.text ?? '')

    return {
      telegram: {
        update_id: Date.now(),
        message: toTelegramMessage(chatId, { ...msg, text }),
      },
      chatId,
      startId,
      buttonId,
    }
  }

  return null
}

export function rubikaInlineToTelegram(
  inline: RubikaInlineMessage
): {
  telegram: TelegramUpdate
  chatId: string
  buttonId: string | null
} | null {
  const chatId = inline.chat_id
  if (!chatId) return null
  const buttonId = inline.aux_data?.button_id
    ? String(inline.aux_data.button_id)
    : null
  if (!buttonId) return null

  const msg = toTelegramMessage(chatId, {
    message_id: inline.message_id,
    text: inline.text,
    sender_id: inline.sender_id,
  })

  const callback: TelegramCallbackQuery = {
    id: `rk-inline-${buttonId}-${inline.message_id}`,
    from: msg.from ?? { id: 0, is_bot: false, first_name: 'User' },
    message: msg,
    data: buttonId,
    chat_instance: chatId,
  }

  return {
    telegram: { update_id: Date.now(), callback_query: callback },
    chatId,
    buttonId,
  }
}
