/**
 * Rubika Bot API client — https://botapi.rubika.ir/v3/{token}/{method}
 * Response shape: { status: "OK", data: T }
 */

export const RUBIKA_API_BASE = 'https://botapi.rubika.ir/v3'

export class RubikaApiError extends Error {
  constructor(
    public readonly description: string,
    public readonly errorCode?: number
  ) {
    super(description)
    this.name = 'RubikaApiError'
  }
}

export type RubikaBot = {
  bot_id?: string
  bot_title?: string
  username?: string
  description?: string
  start_message?: string
  share_url?: string
}

export type RubikaAuxData = {
  start_id?: string | null
  button_id?: string | null
}

export type RubikaContact = {
  phone_number?: string
  first_name?: string
  last_name?: string
}

export type RubikaMessage = {
  message_id: string | number
  text?: string
  time?: string | number
  is_edited?: boolean
  sender_type?: string
  sender_id?: string
  aux_data?: RubikaAuxData | null
  contact_message?: RubikaContact | null
}

export type RubikaUpdate = {
  type: string
  chat_id: string
  new_message?: RubikaMessage
  updated_message?: RubikaMessage | null
  removed_message_id?: string | null
}

export type RubikaInlineMessage = {
  sender_id?: string
  text?: string
  location?: unknown
  aux_data?: RubikaAuxData | null
  message_id: string | number
  chat_id: string
}

export type RubikaButton = {
  id: string
  type: string
  button_text: string
}

export type RubikaKeypad = {
  rows: { buttons: RubikaButton[] }[]
  resize_keyboard?: boolean
  one_time_keyboard?: boolean
}

type RubikaResponse<T> = {
  status?: string
  data?: T
  message?: string
  error?: string
}

async function callApi<T>(
  token: string,
  method: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  const url = `${RUBIKA_API_BASE}/${encodeURIComponent(token)}/${method}`
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new RubikaApiError(
      `ارتباط با روبیکا برقرار نشد: ${
        error instanceof Error ? error.message : 'خطای شبکه'
      }`
    )
  }

  let payload: RubikaResponse<T>
  try {
    payload = (await response.json()) as RubikaResponse<T>
  } catch {
    throw new RubikaApiError('پاسخ نامعتبر از روبیکا', response.status)
  }

  if (!response.ok || payload.status !== 'OK' || payload.data === undefined) {
    throw new RubikaApiError(
      payload.message ??
        payload.error ??
        (typeof payload.status === 'string' && payload.status !== 'OK'
          ? payload.status
          : 'خطای ناشناخته روبیکا'),
      response.status
    )
  }

  return payload.data
}

export async function getMe(token: string): Promise<RubikaBot> {
  const data = await callApi<RubikaBot | { bot: RubikaBot }>(token, 'getMe')
  if (data && typeof data === 'object' && 'bot' in data && data.bot) {
    return data.bot
  }
  return data as RubikaBot
}

export async function sendMessage(
  token: string,
  chatId: string,
  text: string,
  options?: {
    inlineKeypad?: RubikaKeypad
    chatKeypad?: RubikaKeypad
    chatKeypadType?: 'New' | 'Remove' | 'None'
    disableNotification?: boolean
  }
): Promise<{ message_id: string }> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    disable_notification: options?.disableNotification ?? false,
  }
  if (options?.inlineKeypad) {
    body.inline_keypad = options.inlineKeypad
  }
  if (options?.chatKeypadType === 'Remove') {
    body.chat_keypad_type = 'Remove'
  } else if (options?.chatKeypad) {
    body.chat_keypad = options.chatKeypad
    body.chat_keypad_type = options.chatKeypadType ?? 'New'
  }
  return callApi<{ message_id: string }>(token, 'sendMessage', body)
}

export async function editMessageText(
  token: string,
  chatId: string,
  messageId: string,
  text: string
): Promise<void> {
  await callApi(token, 'editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
  })
}

export async function editInlineKeypad(
  token: string,
  chatId: string,
  messageId: string,
  inlineKeypad: RubikaKeypad
): Promise<void> {
  // Official docs: editInlineKeypad; some SDKs use editMessageKeypad
  try {
    await callApi(token, 'editInlineKeypad', {
      chat_id: chatId,
      message_id: messageId,
      inline_keypad: inlineKeypad,
    })
  } catch {
    await callApi(token, 'editMessageKeypad', {
      chat_id: chatId,
      message_id: messageId,
      inline_keypad: inlineKeypad,
    })
  }
}

export async function getUpdates(
  token: string,
  options?: { offsetId?: string; limit?: number }
): Promise<{ updates: RubikaUpdate[]; next_offset_id: string }> {
  const body: Record<string, unknown> = {
    limit: options?.limit ?? 100,
  }
  if (options?.offsetId) body.offset_id = options.offsetId
  return callApi(token, 'getUpdates', body)
}

export async function updateBotEndpoints(
  token: string,
  url: string,
  type:
    | 'ReceiveUpdate'
    | 'ReceiveInlineMessage'
    | 'ReceiveQuery'
    | 'GetSelectionItem'
    | 'SearchSelectionItems'
): Promise<string> {
  const data = await callApi<{ status?: string }>(token, 'updateBotEndpoints', {
    url,
    type,
  })
  return data.status ?? 'OK'
}

export async function clearBotEndpoints(token: string): Promise<void> {
  // Empty URL clears registered endpoints when supported by the platform.
  for (const type of ['ReceiveUpdate', 'ReceiveInlineMessage'] as const) {
    try {
      await updateBotEndpoints(token, '', type)
    } catch (error) {
      console.error(`[rubika] clear endpoint ${type} failed`, error)
    }
  }
}
