import type {
  InlineKeyboardButton,
  ReplyKeyboardButton,
  TelegramReplyMarkup,
} from './api'

export const BTN = {
  connect: 'اتصال حساب',
  sharePhone: 'ارسال شماره موبایل',
  cancel: 'لغو',
  unlink: 'قطع اتصال',
  mainMenu: 'منوی اصلی',
  // Lawyer
  cases: 'پرونده‌ها',
  clients: 'موکل‌ها',
  consultations: 'درخواست‌ها',
  events: 'جلسات',
  financial: 'مالی',
  stats: 'آمار',
  notifications: 'اعلان‌ها',
  // Client
  summary: 'خلاصه',
  myCases: 'پرونده‌های من',
  mySessions: 'جلسات من',
  myPayments: 'پرداخت‌ها',
  newCase: 'ثبت پرونده جدید',
} as const

export function replyKeyboard(
  rows: ReplyKeyboardButton[][],
  options?: { oneTime?: boolean }
): TelegramReplyMarkup {
  return {
    keyboard: rows,
    resize_keyboard: true,
    one_time_keyboard: options?.oneTime ?? false,
  }
}

export function inlineKeyboard(
  rows: InlineKeyboardButton[][]
): TelegramReplyMarkup {
  return { inline_keyboard: rows }
}

export function removeKeyboard(): TelegramReplyMarkup {
  return { remove_keyboard: true }
}

export function guestKeyboard(): TelegramReplyMarkup {
  return replyKeyboard([[{ text: BTN.connect }]])
}

export function phoneRequestKeyboard(): TelegramReplyMarkup {
  return replyKeyboard(
    [
      [{ text: BTN.sharePhone, request_contact: true }],
      [{ text: BTN.cancel }],
    ],
    { oneTime: true }
  )
}

export function lawyerMainKeyboard(): TelegramReplyMarkup {
  return replyKeyboard([
    [{ text: BTN.cases }, { text: BTN.clients }],
    [{ text: BTN.consultations }, { text: BTN.events }],
    [{ text: BTN.financial }, { text: BTN.stats }],
    [{ text: BTN.notifications }, { text: BTN.unlink }],
  ])
}

export function clientMainKeyboard(): TelegramReplyMarkup {
  return replyKeyboard([
    [{ text: BTN.summary }],
    [{ text: BTN.myCases }, { text: BTN.newCase }],
    [{ text: BTN.mySessions }, { text: BTN.myPayments }],
    [{ text: BTN.notifications }, { text: BTN.unlink }],
  ])
}

export function cancelOnlyKeyboard(): TelegramReplyMarkup {
  return replyKeyboard([[{ text: BTN.cancel }]])
}

export function cb(action: string, ...parts: string[]): string {
  const raw = [action, ...parts].join(':')
  // Telegram callback_data max 64 bytes
  return raw.slice(0, 64)
}
