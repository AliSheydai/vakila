import {
  CLIENT_CASE_STATUS_LABELS,
  type ClientCaseStatus,
  LEGAL_AREA_LABELS,
  LEGAL_AREAS,
  type LegalArea,
} from '@/features/client-portal/types'
import { getEnv } from '@/server/env'
import * as conversationsRepo from '@/server/repositories/messenger-conversations-repo'
import * as notificationsRepo from '@/server/repositories/notifications-repo'
import * as portalRepo from '@/server/repositories/portal-repo'
import type { User } from '@/server/types'
import type { TelegramCallbackQuery, TelegramMessage } from '../api'
import {
  type BotContext,
  ackCallback,
  displayName,
  editReply,
  reply,
} from '../context'
import { esc, formatDate, formatMoney, pageSlice, stripHtml, truncate } from '../format'
import {
  BTN,
  cancelOnlyKeyboard,
  cb,
  clientMainKeyboard,
  inlineKeyboard,
} from '../keyboards'
import { unlinkAccount } from './guest'

const PLATFORM = 'telegram' as const
const PAGE_SIZE = 5

export async function sendClientHome(ctx: BotContext, user: User): Promise<void> {
  await conversationsRepo.clearConversation(PLATFORM, ctx.chatId)
  await reply(
    ctx,
    `منوی موکل — ${esc(displayName(user))}\nیکی از گزینه‌ها را انتخاب کنید.`,
    clientMainKeyboard()
  )
}

async function showSummary(ctx: BotContext, user: User): Promise<void> {
  const data = await portalRepo.getPortalData(user)
  const upcoming = data.sessions
    .filter((s) => s.status !== 'cancelled' && s.status !== 'completed')
    .slice(0, 3)
  const pendingPay = data.payments.filter((p) => p.status === 'pending')

  await reply(
    ctx,
    `<b>خلاصه داشبورد</b>\n` +
      `پرونده‌ها: ${data.cases.length}\n` +
      `پرداخت در انتظار: ${pendingPay.length}\n` +
      `جلسات نزدیک: ${upcoming.length}` +
      (upcoming[0]
        ? `\nبعدی: ${esc(upcoming[0].title)} — ${formatDate(upcoming[0].startsAt)}`
        : ''),
    clientMainKeyboard()
  )
}

async function listCases(
  ctx: BotContext,
  user: User,
  page: number,
  messageId?: number
): Promise<void> {
  const data = await portalRepo.getPortalData(user)
  const slice = pageSlice(data.cases, page, PAGE_SIZE)

  if (data.cases.length === 0) {
    await reply(
      ctx,
      'پرونده‌ای ندارید. می‌توانید از منو پرونده جدید ثبت کنید.',
      clientMainKeyboard()
    )
    return
  }

  const lines = slice.items.map((c, i) => {
    const status =
      CLIENT_CASE_STATUS_LABELS[c.status as ClientCaseStatus] ?? c.status
    return `${(slice.page - 1) * PAGE_SIZE + i + 1}. <b>${esc(c.title)}</b> — ${status}`
  })
  const buttons = slice.items.map((c) => [
    { text: truncate(c.title, 40), callback_data: cb('cc', c.id) },
  ])
  const nav: { text: string; callback_data: string }[] = []
  if (slice.hasPrev) nav.push({ text: 'قبلی', callback_data: cb('ccp', String(slice.page - 1)) })
  if (slice.hasNext) nav.push({ text: 'بعدی', callback_data: cb('ccp', String(slice.page + 1)) })
  if (nav.length) buttons.push(nav)

  const text = `پرونده‌های من (${slice.page}/${slice.totalPages})\n\n${lines.join('\n')}`
  const markup = inlineKeyboard(buttons)
  if (messageId) await editReply(ctx, messageId, text, markup)
  else await reply(ctx, text, markup)
}

async function showCase(
  ctx: BotContext,
  user: User,
  caseId: string,
  messageId?: number
): Promise<void> {
  const data = await portalRepo.getPortalData(user)
  const c = data.cases.find((x) => x.id === caseId)
  if (!c) {
    await reply(ctx, 'پرونده یافت نشد.')
    return
  }
  const status =
    CLIENT_CASE_STATUS_LABELS[c.status as ClientCaseStatus] ?? c.status
  const lastComments = c.comments.slice(-3)
  const commentBlock =
    lastComments.length > 0
      ? `\n\nآخرین نظرات:\n${lastComments
          .map(
            (cm) =>
              `• ${esc(cm.authorName)}: ${esc(truncate(stripHtml(cm.bodyHtml), 80))}`
          )
          .join('\n')}`
      : ''

  const text =
    `<b>${esc(c.title)}</b>\n` +
    `شماره: ${esc(c.caseNumber)}\n` +
    `وضعیت: ${status}\n` +
    `حوزه: ${LEGAL_AREA_LABELS[c.legalArea as LegalArea] ?? c.legalArea}` +
    commentBlock

  const markup = inlineKeyboard([
    [{ text: 'افزودن نظر', callback_data: cb('ccc', caseId) }],
    [{ text: 'بازگشت', callback_data: cb('ccp', '1') }],
  ])

  if (messageId) await editReply(ctx, messageId, text, markup)
  else await reply(ctx, text, markup)
}

async function listSessions(ctx: BotContext, user: User): Promise<void> {
  const data = await portalRepo.getPortalData(user)
  const sessions = data.sessions
    .filter((s) => s.status !== 'cancelled')
    .slice(0, 10)

  if (sessions.length === 0) {
    await reply(ctx, 'جلسه‌ای ندارید.', clientMainKeyboard())
    return
  }

  const appUrl = getEnv().APP_URL.replace(/\/$/, '')
  const lines = sessions.map((s, i) => {
    const lobby =
      s.type === 'online'
        ? `\n   لابی: ${appUrl}/call/${s.id}/lobby`
        : ''
    const when = formatDate(s.startsAt)
    return (
      `${i + 1}. <b>${esc(s.title)}</b>\n` +
      `   ${when} — ${esc(s.status)}` +
      lobby
    )
  })

  const buttons = sessions
    .filter((s) => s.canCancel)
    .map((s) => [
      {
        text: `لغو: ${truncate(s.title, 30)}`,
        callback_data: cb('csc', s.id),
      },
    ])

  await reply(
    ctx,
    `جلسات من\n\n${lines.join('\n\n')}`,
    buttons.length ? inlineKeyboard(buttons) : clientMainKeyboard()
  )
}

async function listPayments(ctx: BotContext, user: User): Promise<void> {
  const data = await portalRepo.getPortalData(user)
  if (data.payments.length === 0) {
    await reply(ctx, 'پرداختی ثبت نشده است.', clientMainKeyboard())
    return
  }

  const lines = data.payments.slice(0, 10).map((p, i) => {
    return (
      `${i + 1}. ${formatMoney(p.amount)} — ${esc(p.status)}\n` +
      `   ${p.title ? esc(p.title) : 'پرداخت'}`
    )
  })

  await reply(
    ctx,
    `پرداخت‌های من\n\n${lines.join('\n\n')}`,
    clientMainKeyboard()
  )
}

async function showNotifications(ctx: BotContext, user: User): Promise<void> {
  const items = await notificationsRepo.listNotifications(user.id, {
    unreadOnly: true,
    limit: 10,
  })
  if (items.length === 0) {
    await reply(ctx, 'اعلان خوانده‌نشده‌ای ندارید.', clientMainKeyboard())
    return
  }
  const lines = items.map(
    (n, i) => `${i + 1}. <b>${esc(n.title)}</b>\n   ${esc(truncate(n.body, 100))}`
  )
  const buttons = [
    ...items.map((n) => [
      { text: truncate(n.title, 40), callback_data: cb('cnr', n.id) },
    ]),
    [{ text: 'همه خوانده شد', callback_data: cb('cnra') }],
  ]
  await reply(
    ctx,
    `اعلان‌ها\n\n${lines.join('\n\n')}`,
    inlineKeyboard(buttons)
  )
}

async function startNewCase(ctx: BotContext): Promise<void> {
  await conversationsRepo.setConversation(
    PLATFORM,
    ctx.chatId,
    'client_new_case_title',
    {}
  )
  await reply(ctx, 'عنوان پرونده را وارد کنید:', cancelOnlyKeyboard())
}

export async function handleClientMessage(
  ctx: BotContext,
  user: User,
  message: TelegramMessage
): Promise<boolean> {
  const text = message.text?.trim() ?? ''
  const conversation = await conversationsRepo.getConversation(
    PLATFORM,
    ctx.chatId
  )

  if (text === '/start' || text === BTN.mainMenu) {
    await sendClientHome(ctx, user)
    return true
  }
  if (text === BTN.unlink || text === '/logout') {
    await unlinkAccount(ctx)
    return true
  }
  if (text === BTN.cancel) {
    await conversationsRepo.clearConversation(PLATFORM, ctx.chatId)
    await sendClientHome(ctx, user)
    return true
  }

  if (conversation.state === 'client_new_case_title') {
    if (!text) {
      await reply(ctx, 'عنوان را وارد کنید.', cancelOnlyKeyboard())
      return true
    }
    await conversationsRepo.setConversation(
      PLATFORM,
      ctx.chatId,
      'client_new_case_area',
      { title: text }
    )
    const buttons = LEGAL_AREAS.map((area) => [
      {
        text: LEGAL_AREA_LABELS[area],
        callback_data: cb('cca', area),
      },
    ])
    await reply(
      ctx,
      'حوزه حقوقی را انتخاب کنید:',
      inlineKeyboard(buttons)
    )
    return true
  }

  if (conversation.state === 'client_new_case_desc') {
    const title = String(conversation.context.title ?? '')
    const legalArea = String(conversation.context.legalArea ?? 'other')
    if (!title) {
      await startNewCase(ctx)
      return true
    }
    try {
      const created = await portalRepo.createPortalCase(user, {
        title,
        legalArea,
        descriptionHtml:
          text && text !== '-' ? `<p>${esc(text)}</p>` : undefined,
      })
      await conversationsRepo.clearConversation(PLATFORM, ctx.chatId)
      await reply(
        ctx,
        `پرونده «${esc(created.title)}» ثبت شد.`,
        clientMainKeyboard()
      )
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'ثبت پرونده ناموفق بود.'
      await reply(ctx, msg, clientMainKeyboard())
      await conversationsRepo.clearConversation(PLATFORM, ctx.chatId)
    }
    return true
  }

  if (conversation.state === 'client_add_comment') {
    const caseId = String(conversation.context.caseId ?? '')
    if (!caseId || !text) {
      await reply(ctx, 'متن نظر را وارد کنید.', cancelOnlyKeyboard())
      return true
    }
    try {
      await portalRepo.addPortalComment(user, caseId, {
        bodyHtml: `<p>${esc(text)}</p>`,
      })
      await conversationsRepo.clearConversation(PLATFORM, ctx.chatId)
      await reply(ctx, 'نظر شما ثبت شد.', clientMainKeyboard())
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'ثبت نظر ناموفق بود.'
      await reply(ctx, msg, clientMainKeyboard())
      await conversationsRepo.clearConversation(PLATFORM, ctx.chatId)
    }
    return true
  }

  switch (text) {
    case BTN.summary:
      await showSummary(ctx, user)
      return true
    case BTN.myCases:
      await listCases(ctx, user, 1)
      return true
    case BTN.newCase:
      await startNewCase(ctx)
      return true
    case BTN.mySessions:
      await listSessions(ctx, user)
      return true
    case BTN.myPayments:
      await listPayments(ctx, user)
      return true
    case BTN.notifications:
      await showNotifications(ctx, user)
      return true
    default:
      await reply(ctx, 'از دکمه‌های منو استفاده کنید.', clientMainKeyboard())
      return true
  }
}

export async function handleClientCallback(
  ctx: BotContext,
  user: User,
  query: TelegramCallbackQuery
): Promise<boolean> {
  const data = query.data ?? ''
  const messageId = query.message?.message_id
  await ackCallback(ctx, query.id)

  const [action, a] = data.split(':')

  switch (action) {
    case 'ccp':
      await listCases(ctx, user, Number(a) || 1, messageId)
      return true
    case 'cc':
      if (a) await showCase(ctx, user, a, messageId)
      return true
    case 'ccc':
      if (!a) return true
      await conversationsRepo.setConversation(
        PLATFORM,
        ctx.chatId,
        'client_add_comment',
        { caseId: a }
      )
      await reply(ctx, 'متن نظر خود را بنویسید:', cancelOnlyKeyboard())
      return true
    case 'cca': {
      if (!a || !(LEGAL_AREAS as readonly string[]).includes(a)) return true
      const conversation = await conversationsRepo.getConversation(
        PLATFORM,
        ctx.chatId
      )
      const title = String(conversation.context.title ?? '')
      if (!title) {
        await startNewCase(ctx)
        return true
      }
      await conversationsRepo.setConversation(
        PLATFORM,
        ctx.chatId,
        'client_new_case_desc',
        { title, legalArea: a }
      )
      await reply(
        ctx,
        'توضیح کوتاه پرونده را بنویسید (یا «-» برای رد کردن):',
        cancelOnlyKeyboard()
      )
      return true
    }
    case 'csc':
      if (!a) return true
      try {
        await portalRepo.cancelPortalSession(user, a)
        await reply(ctx, 'جلسه لغو شد.', clientMainKeyboard())
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'لغو جلسه ناموفق بود.'
        await reply(ctx, msg, clientMainKeyboard())
      }
      return true
    case 'cnr':
      if (a) {
        await notificationsRepo.markNotificationRead(user.id, a)
        await showNotifications(ctx, user)
      }
      return true
    case 'cnra':
      await notificationsRepo.markAllNotificationsRead(user.id)
      await reply(ctx, 'همه اعلان‌ها خوانده شدند.', clientMainKeyboard())
      return true
    default:
      return false
  }
}
