const TELEGRAM_API = 'https://api.telegram.org'

export class TelegramApiError extends Error {
  constructor(
    public readonly description: string,
    public readonly errorCode?: number
  ) {
    super(description)
    this.name = 'TelegramApiError'
  }
}

type TelegramResponse<T> = {
  ok: boolean
  result?: T
  description?: string
  error_code?: number
}

export type TelegramUser = {
  id: number
  is_bot: boolean
  first_name: string
  username?: string
}

export type TelegramChat = {
  id: number
  type: string
  title?: string
  username?: string
  first_name?: string
  last_name?: string
}

export type TelegramMessage = {
  message_id: number
  date: number
  chat: TelegramChat
  from?: TelegramUser
  text?: string
  contact?: {
    phone_number: string
    first_name: string
    user_id?: number
  }
}

export type TelegramCallbackQuery = {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
  chat_instance: string
}

export type TelegramUpdate = {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

export type InlineKeyboardButton = {
  text: string
  callback_data?: string
  url?: string
}

export type ReplyKeyboardButton = {
  text: string
  request_contact?: boolean
}

export type TelegramReplyMarkup =
  | { inline_keyboard: InlineKeyboardButton[][] }
  | {
      keyboard: ReplyKeyboardButton[][]
      resize_keyboard?: boolean
      one_time_keyboard?: boolean
    }
  | { remove_keyboard: true }

async function callApi<T>(
  token: string,
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${TELEGRAM_API}/bot${token}/${method}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  let payload: TelegramResponse<T>
  try {
    payload = (await response.json()) as TelegramResponse<T>
  } catch {
    throw new TelegramApiError('پاسخ نامعتبر از تلگرام', response.status)
  }

  if (!payload.ok || payload.result === undefined) {
    throw new TelegramApiError(
      payload.description ?? 'خطای ناشناخته تلگرام',
      payload.error_code
    )
  }

  return payload.result
}

export async function getMe(token: string): Promise<TelegramUser> {
  return callApi<TelegramUser>(token, 'getMe')
}

export async function setWebhook(
  token: string,
  options: {
    url: string
    secretToken: string
    allowedUpdates?: string[]
    dropPendingUpdates?: boolean
  }
): Promise<boolean> {
  return callApi<boolean>(token, 'setWebhook', {
    url: options.url,
    secret_token: options.secretToken,
    allowed_updates: options.allowedUpdates,
    drop_pending_updates: options.dropPendingUpdates ?? true,
  })
}

export async function deleteWebhook(token: string): Promise<boolean> {
  return callApi<boolean>(token, 'deleteWebhook', {
    drop_pending_updates: true,
  })
}

export async function getUpdates(
  token: string,
  options?: {
    offset?: number
    timeout?: number
    allowedUpdates?: string[]
  }
): Promise<TelegramUpdate[]> {
  return callApi<TelegramUpdate[]>(token, 'getUpdates', {
    offset: options?.offset,
    timeout: options?.timeout ?? 25,
    allowed_updates: options?.allowedUpdates ?? ['message', 'callback_query'],
  })
}

export async function sendMessage(
  token: string,
  chatId: string | number,
  text: string,
  options?: {
    replyMarkup?: TelegramReplyMarkup
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
    disableWebPagePreview?: boolean
  }
): Promise<TelegramMessage> {
  return callApi<TelegramMessage>(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: options?.parseMode ?? 'HTML',
    disable_web_page_preview: options?.disableWebPagePreview ?? true,
    reply_markup: options?.replyMarkup,
  })
}

export async function editMessageText(
  token: string,
  chatId: string | number,
  messageId: number,
  text: string,
  options?: {
    replyMarkup?: TelegramReplyMarkup
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  }
): Promise<TelegramMessage | boolean> {
  return callApi<TelegramMessage | boolean>(token, 'editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: options?.parseMode ?? 'HTML',
    reply_markup: options?.replyMarkup,
  })
}

export async function answerCallbackQuery(
  token: string,
  callbackQueryId: string,
  text?: string
): Promise<boolean> {
  return callApi<boolean>(token, 'answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
  })
}
