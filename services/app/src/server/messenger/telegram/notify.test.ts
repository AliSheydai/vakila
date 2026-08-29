import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/db', () => ({
  query: vi.fn(),
}))

vi.mock('@/server/repositories/settings-repo', () => ({
  getNotificationDeliverySettings: vi.fn(),
  getUserNotificationPreferences: vi.fn(),
  isMessengerReady: vi.fn(),
  getDecryptedMessengerToken: vi.fn(),
}))

vi.mock('@/server/repositories/messenger-links-repo', () => ({
  getActiveLinkByUser: vi.fn(),
}))

vi.mock('@/server/messenger/telegram/api', () => ({
  sendMessage: vi.fn(),
}))

vi.mock('@/server/messenger/rubika/api', () => ({
  sendMessage: vi.fn(),
}))

vi.mock('@/server/messenger/rubika/keyboards', () => ({
  telegramMarkupToRubika: vi.fn((m) => m),
}))

import { query } from '@/server/db'
import * as settingsRepo from '@/server/repositories/settings-repo'
import * as linksRepo from '@/server/repositories/messenger-links-repo'
import { sendMessage } from '@/server/messenger/telegram/api'
import * as rubikaApi from '@/server/messenger/rubika/api'
import {
  pushMessengerNotifications,
  resolveChatbotPlatforms,
} from './notify'

const queryMock = vi.mocked(query)
const getDelivery = vi.mocked(settingsRepo.getNotificationDeliverySettings)
const getUserPrefs = vi.mocked(settingsRepo.getUserNotificationPreferences)
const isReady = vi.mocked(settingsRepo.isMessengerReady)
const getToken = vi.mocked(settingsRepo.getDecryptedMessengerToken)
const getLink = vi.mocked(linksRepo.getActiveLinkByUser)
const tgSend = vi.mocked(sendMessage)
const rubikaSend = vi.mocked(rubikaApi.sendMessage)

const CLIENT_ID = 'client-user-1'
const LAWYER_ID = 'lawyer-user-1'
const ACTOR_ID = 'client-actor-1'

function mockRecipientRole(role: 'client' | 'lawyer' | 'super_admin' | null) {
  queryMock.mockResolvedValue({
    rows: role ? [{ role }] : [],
    rowCount: role ? 1 : 0,
    command: 'SELECT',
    oid: 0,
    fields: [],
  } as never)
}

function linkFor(userId: string, platform: string, chatId: string) {
  return {
    id: `${platform}-link`,
    chatId,
    userId,
    platform,
    phone: '09000000000',
    linkedAt: new Date().toISOString(),
    revokedAt: null,
    lastSeenAt: new Date().toISOString(),
  } as never
}

describe('resolveChatbotPlatforms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null for client when admin delivery is in_app', async () => {
    mockRecipientRole('client')
    getDelivery.mockResolvedValue({
      clientChannel: 'in_app',
      clientChatbotPlatforms: [],
      updatedAt: null,
    })

    await expect(
      resolveChatbotPlatforms({ recipientId: CLIENT_ID })
    ).resolves.toBeNull()
  })

  it('returns all admin platforms for client when delivery is chatbot', async () => {
    mockRecipientRole('client')
    getDelivery.mockResolvedValue({
      clientChannel: 'chatbot',
      clientChatbotPlatforms: ['telegram', 'bale', 'rubika'],
      updatedAt: null,
    })

    await expect(
      resolveChatbotPlatforms({ recipientId: CLIENT_ID })
    ).resolves.toEqual({
      platforms: ['telegram', 'bale', 'rubika'],
      role: 'client',
    })
  })

  it('returns null for lawyer when actor prefs are in_app', async () => {
    mockRecipientRole('lawyer')
    getUserPrefs.mockResolvedValue({
      channel: 'in_app',
      chatbotPlatforms: [],
      updatedAt: null,
    })

    await expect(
      resolveChatbotPlatforms({
        recipientId: LAWYER_ID,
        actorId: ACTOR_ID,
      })
    ).resolves.toBeNull()
    expect(getUserPrefs).toHaveBeenCalledWith(ACTOR_ID)
  })

  it('returns null for lawyer when actorId is missing', async () => {
    mockRecipientRole('lawyer')

    await expect(
      resolveChatbotPlatforms({ recipientId: LAWYER_ID })
    ).resolves.toBeNull()
    expect(getUserPrefs).not.toHaveBeenCalled()
  })

  it('returns actor platforms for lawyer when client opted into chatbot', async () => {
    mockRecipientRole('lawyer')
    getUserPrefs.mockResolvedValue({
      channel: 'chatbot',
      chatbotPlatforms: ['bale', 'telegram'],
      updatedAt: null,
    })

    await expect(
      resolveChatbotPlatforms({
        recipientId: LAWYER_ID,
        actorId: ACTOR_ID,
      })
    ).resolves.toEqual({
      platforms: ['bale', 'telegram'],
      role: 'lawyer',
    })
  })
})

describe('pushMessengerNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isReady.mockResolvedValue(true)
    getToken.mockResolvedValue('bot-token')
    getLink.mockImplementation(async (platform, userId) =>
      linkFor(userId, platform, `${platform}-chat`)
    )
    tgSend.mockResolvedValue({} as never)
    rubikaSend.mockResolvedValue({} as never)
  })

  it('does not send when admin delivery defaults to in_app (client recipient)', async () => {
    mockRecipientRole('client')
    getDelivery.mockResolvedValue({
      clientChannel: 'in_app',
      clientChatbotPlatforms: [],
      updatedAt: null,
    })

    await pushMessengerNotifications({
      recipientId: CLIENT_ID,
      title: 't',
      body: 'b',
    })

    expect(tgSend).not.toHaveBeenCalled()
    expect(rubikaSend).not.toHaveBeenCalled()
    expect(getToken).not.toHaveBeenCalled()
    expect(getLink).not.toHaveBeenCalled()
  })

  it('sends once to telegram when only telegram is selected and client is linked', async () => {
    mockRecipientRole('client')
    getDelivery.mockResolvedValue({
      clientChannel: 'chatbot',
      clientChatbotPlatforms: ['telegram'],
      updatedAt: null,
    })

    await pushMessengerNotifications({
      recipientId: CLIENT_ID,
      title: 'پرونده جدید',
      body: 'متن',
      caseId: 'case-1',
    })

    expect(isReady).toHaveBeenCalledWith('telegram')
    expect(getLink).toHaveBeenCalledWith('telegram', CLIENT_ID)
    expect(getToken).toHaveBeenCalledWith('telegram')
    expect(tgSend).toHaveBeenCalledTimes(1)
    expect(tgSend.mock.calls[0]?.[0]).toBe('telegram')
    expect(rubikaSend).not.toHaveBeenCalled()
  })

  it('sends to all selected platforms when client is linked on each', async () => {
    mockRecipientRole('client')
    getDelivery.mockResolvedValue({
      clientChannel: 'chatbot',
      clientChatbotPlatforms: ['telegram', 'bale', 'rubika'],
      updatedAt: null,
    })

    await pushMessengerNotifications({
      recipientId: CLIENT_ID,
      title: 't',
      body: 'b',
    })

    expect(tgSend).toHaveBeenCalledTimes(2)
    expect(tgSend.mock.calls.map((c) => c[0]).sort()).toEqual(['bale', 'telegram'])
    expect(rubikaSend).toHaveBeenCalledTimes(1)
    expect(getLink).toHaveBeenCalledWith('telegram', CLIENT_ID)
    expect(getLink).toHaveBeenCalledWith('bale', CLIENT_ID)
    expect(getLink).toHaveBeenCalledWith('rubika', CLIENT_ID)
  })

  it('skips platforms without a link while still sending to linked ones', async () => {
    mockRecipientRole('client')
    getDelivery.mockResolvedValue({
      clientChannel: 'chatbot',
      clientChatbotPlatforms: ['telegram', 'bale'],
      updatedAt: null,
    })
    getLink.mockImplementation(async (platform, userId) => {
      if (platform === 'bale') return null
      return linkFor(userId, platform, `${platform}-chat`)
    })

    await pushMessengerNotifications({
      recipientId: CLIENT_ID,
      title: 't',
      body: 'b',
    })

    expect(tgSend).toHaveBeenCalledTimes(1)
    expect(tgSend.mock.calls[0]?.[0]).toBe('telegram')
    expect(getToken).toHaveBeenCalledWith('telegram')
    expect(getToken).not.toHaveBeenCalledWith('bale')
  })

  it('does not send or decrypt token when client has no messenger link', async () => {
    mockRecipientRole('client')
    getDelivery.mockResolvedValue({
      clientChannel: 'chatbot',
      clientChatbotPlatforms: ['telegram'],
      updatedAt: null,
    })
    getLink.mockResolvedValue(null)

    await pushMessengerNotifications({
      recipientId: CLIENT_ID,
      title: 't',
      body: 'b',
    })

    expect(getLink).toHaveBeenCalledWith('telegram', CLIENT_ID)
    expect(getToken).not.toHaveBeenCalled()
    expect(tgSend).not.toHaveBeenCalled()
  })

  it('does not send to lawyer when client prefs are in_app (fixes ungated push)', async () => {
    mockRecipientRole('lawyer')
    getUserPrefs.mockResolvedValue({
      channel: 'in_app',
      chatbotPlatforms: [],
      updatedAt: null,
    })

    await pushMessengerNotifications({
      recipientId: LAWYER_ID,
      actorId: ACTOR_ID,
      title: 't',
      body: 'b',
    })

    expect(tgSend).not.toHaveBeenCalled()
    expect(getLink).not.toHaveBeenCalled()
    expect(getToken).not.toHaveBeenCalled()
  })

  it('does not send to lawyer when actorId is missing', async () => {
    mockRecipientRole('lawyer')

    await pushMessengerNotifications({
      recipientId: LAWYER_ID,
      title: 't',
      body: 'b',
    })

    expect(getUserPrefs).not.toHaveBeenCalled()
    expect(tgSend).not.toHaveBeenCalled()
  })

  it('sends to lawyer on all opted-in platforms when linked', async () => {
    mockRecipientRole('lawyer')
    getUserPrefs.mockResolvedValue({
      channel: 'chatbot',
      chatbotPlatforms: ['telegram', 'bale'],
      updatedAt: null,
    })

    await pushMessengerNotifications({
      recipientId: LAWYER_ID,
      actorId: ACTOR_ID,
      title: 'کامنت موکل',
      body: 'متن',
      caseId: 'case-2',
    })

    expect(getUserPrefs).toHaveBeenCalledWith(ACTOR_ID)
    expect(tgSend).toHaveBeenCalledTimes(2)
    expect(tgSend.mock.calls.map((c) => c[0]).sort()).toEqual(['bale', 'telegram'])
  })
})
