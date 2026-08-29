import type { TelegramReplyMarkup } from '@/server/messenger/telegram/api'
import type { RubikaButton, RubikaKeypad } from './api'

function simpleButton(id: string, text: string): RubikaButton {
  return { id: id.slice(0, 64), type: 'Simple', button_text: text }
}

/**
 * Convert Telegram-style reply markup used by shared handlers into Rubika keypads.
 */
export function telegramMarkupToRubika(markup?: TelegramReplyMarkup): {
  inlineKeypad?: RubikaKeypad
  chatKeypad?: RubikaKeypad
  chatKeypadType?: 'New' | 'Remove'
} {
  if (!markup) return {}

  if ('remove_keyboard' in markup && markup.remove_keyboard) {
    return { chatKeypadType: 'Remove' }
  }

  if ('inline_keyboard' in markup) {
    return {
      inlineKeypad: {
        rows: markup.inline_keyboard.map((row) => ({
          buttons: row.map((btn) =>
            simpleButton(btn.callback_data ?? btn.url ?? btn.text, btn.text)
          ),
        })),
      },
    }
  }

  if ('keyboard' in markup) {
    return {
      chatKeypadType: 'New',
      chatKeypad: {
        rows: markup.keyboard.map((row) => ({
          buttons: row.map((btn) => {
            if (btn.request_contact) {
              return {
                id: btn.text.slice(0, 64) || 'ask_phone',
                type: 'AskMyPhoneNumber',
                button_text: btn.text,
              }
            }
            return simpleButton(btn.text, btn.text)
          }),
        })),
        resize_keyboard: markup.resize_keyboard ?? true,
        one_time_keyboard: markup.one_time_keyboard ?? false,
      },
    }
  }

  return {}
}
