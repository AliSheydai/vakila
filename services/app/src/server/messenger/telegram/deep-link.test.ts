import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/env', () => ({
  getEnv: () => ({ SESSION_SECRET: 'test-session-secret-for-deeplink' }),
}))

import {
  buildBotDeepLink,
  createBotStartPayload,
  isPublicBotUsername,
  verifyBotStartPayload,
} from './deep-link'
import { rubikaUpdateToTelegram } from '@/server/messenger/rubika/adapt'

describe('bot deep links', () => {
  const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

  beforeEach(() => {
    vi.useRealTimers()
  })

  it('round-trips a signed payload per platform', () => {
    for (const platform of ['telegram', 'bale', 'rubika'] as const) {
      const payload = createBotStartPayload(platform, userId)
      expect(payload.length).toBeLessThanOrEqual(64)
      expect(verifyBotStartPayload(platform, payload)).toBe(userId)
      expect(verifyBotStartPayload(platform, encodeURIComponent(payload))).toBe(
        userId
      )
      // Wrong platform namespace must fail
      const other = platform === 'telegram' ? 'bale' : 'telegram'
      expect(verifyBotStartPayload(other, payload)).toBeNull()
    }
  })

  it('builds messenger URLs without encoding safe payloads', () => {
    const payload = createBotStartPayload('rubika', userId)
    expect(buildBotDeepLink('rubika', 'VakilaBot', payload)).toBe(
      `https://rubika.ir/VakilaBot?st=${payload}`
    )
    expect(buildBotDeepLink('telegram', 'VakilaBot', payload)).toBe(
      `https://t.me/VakilaBot?start=${payload}`
    )
    expect(buildBotDeepLink('bale', 'VakilaBot', payload)).toBe(
      `https://ble.ir/VakilaBot?start=${payload}`
    )
  })

  it('rejects placeholder bot usernames', () => {
    expect(isPublicBotUsername('id_12345')).toBe(false)
    expect(isPublicBotUsername('rubika_bot')).toBe(false)
    expect(isPublicBotUsername('VakilaBot')).toBe(true)
  })
})

describe('rubikaUpdateToTelegram deep-link', () => {
  it('keeps start_id even when Rubika also sends start_message text', () => {
    const payload = 'abc'
    const adapted = rubikaUpdateToTelegram({
      type: 'NewMessage',
      chat_id: 'chat-1',
      new_message: {
        message_id: '99',
        text: 'به بات خوش آمدید',
        sender_id: 'user-1',
        aux_data: { start_id: payload, button_id: null },
      },
    })

    expect(adapted?.telegram.message?.text).toBe(`/start ${payload}`)
    expect(adapted?.startId).toBe(payload)
  })

  it('maps StartedBot with start_id to /start payload', () => {
    const adapted = rubikaUpdateToTelegram({
      type: 'StartedBot',
      chat_id: 'chat-1',
      new_message: {
        message_id: '1',
        text: 'start',
        aux_data: { start_id: 'tok_en', button_id: null },
      },
    })
    expect(adapted?.telegram.message?.text).toBe('/start tok_en')
  })
})
