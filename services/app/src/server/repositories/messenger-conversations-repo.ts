import { query } from '../db'
import type { MessengerPlatform } from './settings-repo'

export type ConversationState = {
  platform: MessengerPlatform
  chatId: string
  state: string
  context: Record<string, unknown>
  updatedAt: string
}

type Row = {
  platform: MessengerPlatform
  chat_id: string
  state: string
  context: Record<string, unknown> | string
  updated_at: Date | string
}

function parseContext(
  value: Record<string, unknown> | string
): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return value ?? {}
}

function mapRow(row: Row): ConversationState {
  return {
    platform: row.platform,
    chatId: row.chat_id,
    state: row.state,
    context: parseContext(row.context),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at),
  }
}

export async function getConversation(
  platform: MessengerPlatform,
  chatId: string
): Promise<ConversationState> {
  const { rows } = await query<Row>(
    `SELECT platform, chat_id, state, context, updated_at
     FROM messenger_conversations
     WHERE platform = $1 AND chat_id = $2
     LIMIT 1`,
    [platform, chatId]
  )

  if (!rows[0]) {
    return {
      platform,
      chatId,
      state: 'idle',
      context: {},
      updatedAt: new Date().toISOString(),
    }
  }

  return mapRow(rows[0])
}

export async function setConversation(
  platform: MessengerPlatform,
  chatId: string,
  state: string,
  context: Record<string, unknown> = {}
): Promise<ConversationState> {
  const { rows } = await query<Row>(
    `INSERT INTO messenger_conversations (platform, chat_id, state, context, updated_at)
     VALUES ($1, $2, $3, $4::jsonb, NOW())
     ON CONFLICT (platform, chat_id) DO UPDATE SET
       state = EXCLUDED.state,
       context = EXCLUDED.context,
       updated_at = NOW()
     RETURNING platform, chat_id, state, context, updated_at`,
    [platform, chatId, state, JSON.stringify(context)]
  )
  return mapRow(rows[0]!)
}

export async function clearConversation(
  platform: MessengerPlatform,
  chatId: string
): Promise<void> {
  await setConversation(platform, chatId, 'idle', {})
}

export async function patchConversationContext(
  platform: MessengerPlatform,
  chatId: string,
  state: string,
  patch: Record<string, unknown>
): Promise<ConversationState> {
  const current = await getConversation(platform, chatId)
  return setConversation(platform, chatId, state, {
    ...current.context,
    ...patch,
  })
}
