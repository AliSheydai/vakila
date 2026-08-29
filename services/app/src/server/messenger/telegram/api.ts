import { request as httpsRequest } from 'node:https'
import { SocksProxyAgent } from 'socks-proxy-agent'
import {
  type BotApiPlatform,
  botApiBaseUrl,
  botPlatformLabel,
} from '../bot-platforms'
import { getActiveSocksEndpoint } from './v2ray'

export class TelegramApiError extends Error {
  constructor(
    public readonly description: string,
    public readonly errorCode?: number,
    public readonly platform: BotApiPlatform = 'telegram'
  ) {
    super(description)
    this.name = 'TelegramApiError'
  }
}

/** @deprecated Use TelegramApiError — kept as alias for existing catch sites */
export const BotApiError = TelegramApiError

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

/**
 * Bale always renders Markdown (no parse_mode). Convert Telegram HTML markup
 * used by handlers into Bale's spaced *bold* / _italic_ form.
 */
export function htmlToBaleMarkdown(html: string): string {
  let text = html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')

  const stripMdMeta = (s: string) => s.replace(/[*_\[\]`]/g, '')

  text = text.replace(/<b>([\s\S]*?)<\/b>/gi, (_, inner: string) => {
    const clean = stripMdMeta(inner).trim()
    return clean ? ` *${clean}* ` : ''
  })
  text = text.replace(/<strong>([\s\S]*?)<\/strong>/gi, (_, inner: string) => {
    const clean = stripMdMeta(inner).trim()
    return clean ? ` *${clean}* ` : ''
  })
  text = text.replace(/<i>([\s\S]*?)<\/i>/gi, (_, inner: string) => {
    const clean = stripMdMeta(inner).trim()
    return clean ? ` _${clean}_ ` : ''
  })
  text = text.replace(/<em>([\s\S]*?)<\/em>/gi, (_, inner: string) => {
    const clean = stripMdMeta(inner).trim()
    return clean ? ` _${clean}_ ` : ''
  })
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n')
  text = text.replace(/<[^>]+>/g, '')
  // Keep spaces around *bold* / _italic_ (required by Bale); only tidy newlines.
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '')
}

function prepareOutgoingText(
  platform: BotApiPlatform,
  text: string
): string {
  if (platform === 'bale') return htmlToBaleMarkdown(text)
  return text
}

async function postJson<T>(
  url: string,
  body: Record<string, unknown> | undefined,
  agent: SocksProxyAgent | undefined,
  platform: BotApiPlatform
): Promise<{ status: number; json: TelegramResponse<T> }> {
  const payload = body ? JSON.stringify(body) : undefined
  const label = botPlatformLabel(platform)

  if (!agent) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
    let json: TelegramResponse<T>
    try {
      json = (await response.json()) as TelegramResponse<T>
    } catch {
      throw new TelegramApiError(
        `پاسخ نامعتبر از ${label}`,
        response.status,
        platform
      )
    }
    return { status: response.status, json }
  }

  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      url,
      {
        method: 'POST',
        agent,
        timeout: 35_000,
        headers: {
          'Content-Type': 'application/json',
          ...(payload
            ? { 'Content-Length': Buffer.byteLength(payload) }
            : {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8')
          try {
            const json = JSON.parse(raw) as TelegramResponse<T>
            resolve({ status: res.statusCode ?? 0, json })
          } catch {
            reject(
              new TelegramApiError(
                `پاسخ نامعتبر از ${label}`,
                res.statusCode,
                platform
              )
            )
          }
        })
      }
    )
    req.on('timeout', () => {
      req.destroy(new Error(`اتمام زمان انتظار در ارتباط با ${label}`))
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function callApi<T>(
  platform: BotApiPlatform,
  token: string,
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${botApiBaseUrl(platform)}/bot${token}/${method}`
  const label = botPlatformLabel(platform)

  // Proxy is Telegram-only (Iran reachability). Bale is reachable directly.
  const socks =
    platform === 'telegram' ? getActiveSocksEndpoint() : null
  const agent = socks ? new SocksProxyAgent(socks.url) : undefined

  let status: number
  let payload: TelegramResponse<T>
  try {
    const result = await postJson<T>(url, body, agent, platform)
    status = result.status
    payload = result.json
  } catch (error) {
    if (error instanceof TelegramApiError) throw error
    const via =
      socks && platform === 'telegram'
        ? ` از طریق SOCKS5 (${socks.host}:${socks.port})`
        : ''
    throw new TelegramApiError(
      `ارتباط با ${label} برقرار نشد${via}: ${
        error instanceof Error ? error.message : 'خطای شبکه'
      }`,
      undefined,
      platform
    )
  }

  if (!payload.ok || payload.result === undefined) {
    throw new TelegramApiError(
      payload.description ?? `خطای ناشناخته ${label}`,
      payload.error_code ?? status,
      platform
    )
  }

  return payload.result
}

export async function getMe(
  platform: BotApiPlatform,
  token: string
): Promise<TelegramUser> {
  return callApi<TelegramUser>(platform, token, 'getMe')
}

export async function setWebhook(
  platform: BotApiPlatform,
  token: string,
  options: {
    url: string
    secretToken?: string
    allowedUpdates?: string[]
    dropPendingUpdates?: boolean
  }
): Promise<boolean> {
  // Bale docs only document `url` (ports 443/88). Extra Telegram fields can
  // break setWebhook — keep the body minimal for Bale.
  if (platform === 'bale') {
    return callApi<boolean>(platform, token, 'setWebhook', {
      url: options.url,
    })
  }

  return callApi<boolean>(platform, token, 'setWebhook', {
    url: options.url,
    secret_token: options.secretToken,
    allowed_updates: options.allowedUpdates,
    drop_pending_updates: options.dropPendingUpdates ?? true,
  })
}

export async function deleteWebhook(
  platform: BotApiPlatform,
  token: string
): Promise<boolean> {
  if (platform === 'bale') {
    // Bale: empty url disables webhook (docs). Also try deleteWebhook.
    try {
      return await callApi<boolean>(platform, token, 'deleteWebhook')
    } catch {
      return callApi<boolean>(platform, token, 'setWebhook', { url: '' })
    }
  }
  return callApi<boolean>(platform, token, 'deleteWebhook', {
    drop_pending_updates: true,
  })
}

export async function getUpdates(
  platform: BotApiPlatform,
  token: string,
  options?: {
    offset?: number
    timeout?: number
    allowedUpdates?: string[]
  }
): Promise<TelegramUpdate[]> {
  const body: Record<string, unknown> = {
    offset: options?.offset,
    timeout: options?.timeout ?? 25,
  }
  // Bale getUpdates docs: offset, limit, timeout — no allowed_updates
  if (platform === 'telegram') {
    body.allowed_updates =
      options?.allowedUpdates ?? ['message', 'callback_query']
  }
  return callApi<TelegramUpdate[]>(platform, token, 'getUpdates', body)
}

export async function sendMessage(
  platform: BotApiPlatform,
  token: string,
  chatId: string | number,
  text: string,
  options?: {
    replyMarkup?: TelegramReplyMarkup
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
    disableWebPagePreview?: boolean
  }
): Promise<TelegramMessage> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: prepareOutgoingText(platform, text),
    reply_markup: options?.replyMarkup,
  }

  if (platform === 'telegram') {
    body.parse_mode = options?.parseMode ?? 'HTML'
    body.disable_web_page_preview = options?.disableWebPagePreview ?? true
  }
  // Bale: always Markdown — do not send parse_mode

  return callApi<TelegramMessage>(platform, token, 'sendMessage', body)
}

export async function editMessageText(
  platform: BotApiPlatform,
  token: string,
  chatId: string | number,
  messageId: number,
  text: string,
  options?: {
    replyMarkup?: TelegramReplyMarkup
    parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  }
): Promise<TelegramMessage | boolean> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text: prepareOutgoingText(platform, text),
    reply_markup: options?.replyMarkup,
  }
  if (platform === 'telegram') {
    body.parse_mode = options?.parseMode ?? 'HTML'
  }
  return callApi<TelegramMessage | boolean>(
    platform,
    token,
    'editMessageText',
    body
  )
}

export async function answerCallbackQuery(
  platform: BotApiPlatform,
  token: string,
  callbackQueryId: string,
  text?: string
): Promise<boolean> {
  return callApi<boolean>(platform, token, 'answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
  })
}
