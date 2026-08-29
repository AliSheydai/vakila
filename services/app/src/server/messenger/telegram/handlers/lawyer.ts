import {
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  type CaseStatus,
} from '@/features/cases/types'
import { CONSULTATION_REQUEST_STATUS_LABELS } from '@/features/consultation-requests/types'
import { getUpcomingEvents, getThisWeekEvents } from '@/features/events/utils/filters'
import {
  createFinancialDateRange,
  createFinancialPayload,
} from '@/features/financial/services/financial-service'
import {
  createStatisticsDateRange,
  createStatisticsPayload,
} from '@/features/stats/services/statistics-service'
import { getEnv } from '@/server/env'
import * as casesRepo from '@/server/repositories/cases-repo'
import * as clientsRepo from '@/server/repositories/clients-repo'
import * as consultationsRepo from '@/server/repositories/consultation-requests-repo'
import * as conversationsRepo from '@/server/repositories/messenger-conversations-repo'
import * as eventsRepo from '@/server/repositories/events-repo'
import * as notificationsRepo from '@/server/repositories/notifications-repo'
import type { User } from '@/server/types'
import type { TelegramCallbackQuery, TelegramMessage } from '../api'
import {
  type BotContext,
  ackCallback,
  displayName,
  editReply,
  reply,
} from '../context'
import { esc, formatDate, formatMoney, formatChatbotNotificationHtml, formatNotificationDateTime, pageSlice, stripHtml, truncate } from '../format'
import {
  BTN,
  cancelOnlyKeyboard,
  cb,
  inlineKeyboard,
  lawyerMainKeyboard,
} from '../keyboards'
import { unlinkAccount } from './guest'

const PAGE_SIZE = 5

function ownerId(user: User): string {
  return user.id
}

export async function sendLawyerHome(ctx: BotContext, user: User): Promise<void> {
  await conversationsRepo.clearConversation(ctx.platform, ctx.chatId)
  await reply(
    ctx,
    `منوی وکیل — ${esc(displayName(user))}\nیکی از گزینه‌ها را انتخاب کنید.`,
    lawyerMainKeyboard()
  )
}

async function listCasesPage(
  ctx: BotContext,
  user: User,
  page: number,
  messageId?: number
): Promise<void> {
  const cases = await casesRepo.listCases(ownerId(user))
  const slice = pageSlice(cases, page, PAGE_SIZE)

  if (cases.length === 0) {
    const text = 'پرونده‌ای ثبت نشده است.'
    if (messageId) await editReply(ctx, messageId, text)
    else await reply(ctx, text, lawyerMainKeyboard())
    return
  }

  const lines = slice.items.map(
    (c, i) =>
      `${(slice.page - 1) * PAGE_SIZE + i + 1}. <b>${esc(c.title)}</b>\n` +
      `   ${esc(c.caseNumber)} — ${CASE_STATUS_LABELS[c.status as CaseStatus] ?? c.status}`
  )

  const buttons = slice.items.map((c) => [
    { text: truncate(c.title, 40), callback_data: cb('lc', c.id) },
  ])

  const nav: { text: string; callback_data: string }[] = []
  if (slice.hasPrev) nav.push({ text: 'قبلی', callback_data: cb('lcp', String(slice.page - 1)) })
  if (slice.hasNext) nav.push({ text: 'بعدی', callback_data: cb('lcp', String(slice.page + 1)) })
  if (nav.length) buttons.push(nav)

  const text = `پرونده‌ها (${slice.page}/${slice.totalPages})\n\n${lines.join('\n\n')}`
  const markup = inlineKeyboard(buttons)
  if (messageId) await editReply(ctx, messageId, text, markup)
  else await reply(ctx, text, markup)
}

async function showCaseDetail(
  ctx: BotContext,
  user: User,
  caseId: string,
  messageId?: number
): Promise<void> {
  const c = await casesRepo.getCase(ownerId(user), caseId)
  if (!c) {
    await reply(ctx, 'پرونده یافت نشد.')
    return
  }

  const statusLabel = CASE_STATUS_LABELS[c.status as CaseStatus] ?? c.status
  const fee = c.fee?.amount ?? 0
  const paid = c.payments?.reduce((s, p) => s + (p.status === 'completed' ? p.amount : 0), 0) ?? 0
  const text =
    `<b>${esc(c.title)}</b>\n` +
    `شماره: ${esc(c.caseNumber)}\n` +
    `وضعیت: ${statusLabel}\n` +
    `حوزه: ${esc(c.legalArea)}\n` +
    `حق‌الوکاله: ${formatMoney(fee)} | پرداخت‌شده: ${formatMoney(paid)}\n` +
    (c.description ? `\n${esc(truncate(stripHtml(c.description), 300))}` : '')

  const markup = inlineKeyboard([
    [
      { text: 'تغییر وضعیت', callback_data: cb('lcs', caseId) },
      { text: 'افزودن نظر', callback_data: cb('lcc', caseId) },
    ],
    [
      { text: 'ثبت پرداخت', callback_data: cb('lcpay', caseId) },
      { text: 'ثبت هزینه', callback_data: cb('lcexp', caseId) },
    ],
    [{ text: 'بازگشت به لیست', callback_data: cb('lcp', '1') }],
  ])

  if (messageId) await editReply(ctx, messageId, text, markup)
  else await reply(ctx, text, markup)
}

async function showStatusPicker(
  ctx: BotContext,
  caseId: string,
  messageId: number
): Promise<void> {
  const buttons = CASE_STATUSES.map((s) => [
    {
      text: CASE_STATUS_LABELS[s],
      callback_data: cb('lcss', caseId, s),
    },
  ])
  buttons.push([{ text: 'انصراف', callback_data: cb('lc', caseId) }])
  await editReply(
    ctx,
    messageId,
    'وضعیت جدید را انتخاب کنید:',
    inlineKeyboard(buttons)
  )
}

async function listClientsPage(
  ctx: BotContext,
  user: User,
  page: number,
  messageId?: number
): Promise<void> {
  const clients = await clientsRepo.listClients(ownerId(user))
  const slice = pageSlice(clients, page, PAGE_SIZE)

  if (clients.length === 0) {
    await reply(ctx, 'موکلی ثبت نشده است.', lawyerMainKeyboard())
    return
  }

  const lines = slice.items.map(
    (c, i) =>
      `${(slice.page - 1) * PAGE_SIZE + i + 1}. <b>${esc(c.name)}</b> — ${esc(c.phone)}`
  )
  const buttons = slice.items.map((c) => [
    { text: truncate(c.name, 40), callback_data: cb('lcl', c.id) },
  ])
  const nav: { text: string; callback_data: string }[] = []
  if (slice.hasPrev) nav.push({ text: 'قبلی', callback_data: cb('lclp', String(slice.page - 1)) })
  if (slice.hasNext) nav.push({ text: 'بعدی', callback_data: cb('lclp', String(slice.page + 1)) })
  if (nav.length) buttons.push(nav)

  const text = `موکل‌ها (${slice.page}/${slice.totalPages})\n\n${lines.join('\n')}`
  const markup = inlineKeyboard(buttons)
  if (messageId) await editReply(ctx, messageId, text, markup)
  else await reply(ctx, text, markup)
}

async function showClientDetail(
  ctx: BotContext,
  user: User,
  clientId: string,
  messageId?: number
): Promise<void> {
  const client = await clientsRepo.getClient(ownerId(user), clientId)
  if (!client) {
    await reply(ctx, 'موکل یافت نشد.')
    return
  }
  const cases = (await casesRepo.listCases(ownerId(user))).filter(
    (c) => c.clientId === clientId
  )
  const text =
    `<b>${esc(client.name)}</b>\n` +
    `موبایل: ${esc(client.phone)}\n` +
    (client.email ? `ایمیل: ${esc(client.email)}\n` : '') +
    `تعداد پرونده: ${cases.length}\n` +
    (client.notes ? `\n${esc(truncate(client.notes, 200))}` : '')

  const buttons = cases.slice(0, 5).map((c) => [
    { text: truncate(c.title, 40), callback_data: cb('lc', c.id) },
  ])
  buttons.push([{ text: 'بازگشت', callback_data: cb('lclp', '1') }])

  const markup = inlineKeyboard(buttons)
  if (messageId) await editReply(ctx, messageId, text, markup)
  else await reply(ctx, text, markup)
}

async function listConsultations(
  ctx: BotContext,
  user: User,
  messageId?: number
): Promise<void> {
  const items = await consultationsRepo.listConsultationRequests(ownerId(user))
  const open = items.filter((i) => i.status !== 'closed')
  const list = open.length ? open : items.slice(0, 10)

  if (list.length === 0) {
    await reply(ctx, 'درخواستی وجود ندارد.', lawyerMainKeyboard())
    return
  }

  const lines = list.slice(0, 10).map(
    (r, i) =>
      `${i + 1}. <b>${esc(r.name)}</b> (${CONSULTATION_REQUEST_STATUS_LABELS[r.status]})\n` +
      `   ${esc(truncate(r.message, 80))}`
  )
  const buttons = list.slice(0, 10).map((r) => [
    { text: truncate(r.name, 40), callback_data: cb('lcr', r.id) },
  ])

  const text = `درخواست‌های مشاوره\n\n${lines.join('\n\n')}`
  const markup = inlineKeyboard(buttons)
  if (messageId) await editReply(ctx, messageId, text, markup)
  else await reply(ctx, text, markup)
}

async function showConsultation(
  ctx: BotContext,
  user: User,
  id: string,
  messageId?: number
): Promise<void> {
  const r = await consultationsRepo.getConsultationRequest(ownerId(user), id)
  if (!r) {
    await reply(ctx, 'درخواست یافت نشد.')
    return
  }
  const text =
    `<b>${esc(r.name)}</b>\n` +
    `موبایل: ${esc(r.phone)}\n` +
    `وضعیت: ${CONSULTATION_REQUEST_STATUS_LABELS[r.status]}\n\n` +
    `${esc(r.message)}`

  const markup = inlineKeyboard([
    [
      { text: 'در حال بررسی', callback_data: cb('lcrs', id, 'in_review') },
      { text: 'تماس گرفته شد', callback_data: cb('lcrs', id, 'contacted') },
    ],
    [{ text: 'بستن', callback_data: cb('lcrs', id, 'closed') }],
    [{ text: 'بازگشت', callback_data: cb('lcrl', '1') }],
  ])

  if (messageId) await editReply(ctx, messageId, text, markup)
  else await reply(ctx, text, markup)
}

async function listEvents(ctx: BotContext, user: User): Promise<void> {
  const events = await eventsRepo.listEvents(ownerId(user))
  const upcoming = [
    ...getThisWeekEvents(events),
    ...getUpcomingEvents(events),
  ]
  // dedupe by id
  const seen = new Set<string>()
  const list = upcoming.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  }).slice(0, 10)

  if (list.length === 0) {
    await reply(ctx, 'جلسهٔ آینده‌ای نیست.', lawyerMainKeyboard())
    return
  }

  const appUrl = getEnv().APP_URL.replace(/\/$/, '')
  const lines = list.map((e, i) => {
    const lobby =
      e.type === 'online_meeting'
        ? `\n   لابی: ${appUrl}/call/${e.id}/lobby`
        : ''
    return (
      `${i + 1}. <b>${esc(e.title)}</b>\n` +
      `   ${formatDate(e.date)} ساعت ${esc(e.startTime?.slice(0, 5) ?? '')}` +
      lobby
    )
  })

  const buttons = list.map((e) => [
    { text: truncate(e.title, 40), callback_data: cb('lev', e.id) },
  ])

  await reply(
    ctx,
    `جلسات پیش‌رو\n\n${lines.join('\n\n')}`,
    inlineKeyboard(buttons)
  )
}

async function showEvent(
  ctx: BotContext,
  user: User,
  id: string,
  messageId?: number
): Promise<void> {
  const e = await eventsRepo.getEvent(ownerId(user), id)
  if (!e) {
    await reply(ctx, 'جلسه یافت نشد.')
    return
  }
  const appUrl = getEnv().APP_URL.replace(/\/$/, '')
  const lobby =
    e.type === 'online_meeting'
      ? `\nلابی ویدیو: ${appUrl}/call/${e.id}/lobby`
      : ''
  const text =
    `<b>${esc(e.title)}</b>\n` +
    `تاریخ: ${formatDate(e.date)} ساعت ${esc(e.startTime?.slice(0, 5) ?? '')}\n` +
    `وضعیت: ${esc(e.status)}\n` +
    (e.location ? `مکان: ${esc(e.location)}\n` : '') +
    lobby

  const markup = inlineKeyboard([
    [{ text: 'بازگشت منو', callback_data: cb('home') }],
  ])
  if (messageId) await editReply(ctx, messageId, text, markup)
  else await reply(ctx, text, markup)
}

async function showFinancial(ctx: BotContext, user: User): Promise<void> {
  const [cases, clients] = await Promise.all([
    casesRepo.listCases(ownerId(user)),
    clientsRepo.listClients(ownerId(user)),
  ])
  const range = createFinancialDateRange('this_month')
  const payload = createFinancialPayload({ cases, clients }, range)
  const s = payload.summary
  await reply(
    ctx,
    `<b>خلاصه مالی این ماه</b>\n` +
      `درآمد ناخالص: ${formatMoney(s.grossRevenue)}\n` +
      `درآمد خالص: ${formatMoney(s.netRevenue)}\n` +
      `هزینه‌ها: ${formatMoney(s.expensesTotal)}\n` +
      `سود: ${formatMoney(s.profit)}\n` +
      `مطالبات: ${formatMoney(s.receivables)}`,
    lawyerMainKeyboard()
  )
}

async function showStats(ctx: BotContext, user: User): Promise<void> {
  const [cases, clients, events] = await Promise.all([
    casesRepo.listCases(ownerId(user)),
    clientsRepo.listClients(ownerId(user)),
    eventsRepo.listEvents(ownerId(user)),
  ])
  const range = createStatisticsDateRange('this_month')
  const payload = createStatisticsPayload({ cases, clients, events }, range)
  const kpiValue = (metric: string) =>
    payload.kpis.find((k) => k.metric === metric)?.value ?? 0
  const activeCases = cases.filter(
    (c) => c.status === 'active' || c.status === 'under_review' || c.status === 'awaiting_action'
  ).length
  await reply(
    ctx,
    `<b>آمار این ماه</b>\n` +
      `پرونده فعال: ${activeCases}\n` +
      `پرونده جدید: ${kpiValue('created_cases')}\n` +
      `پرونده بسته‌شده: ${kpiValue('closed_cases')}\n` +
      `جلسات: ${kpiValue('sessions')}\n` +
      `موکل جدید: ${kpiValue('new_clients')}`,
    lawyerMainKeyboard()
  )
}

async function showNotifications(ctx: BotContext, user: User): Promise<void> {
  const items = await notificationsRepo.listNotifications(user.id, {
    unreadOnly: true,
    limit: 10,
  })
  if (items.length === 0) {
    await reply(ctx, 'اعلان خوانده‌نشده‌ای ندارید.', lawyerMainKeyboard())
    return
  }
  const lines = items.map((n, i) => {
    const when = formatNotificationDateTime(n.createdAt)
    const preview = truncate(n.body.replace(/\s+/g, ' ').trim(), 80)
    return (
      `${i + 1}. <b>${esc(n.title)}</b>\n` +
      `   <i>${esc(when)}</i>\n` +
      `   ${esc(preview)}`
    )
  })
  const buttons = items.map((n, i) => [
    {
      text: `${i + 1}. ${truncate(n.title, 36)}`,
      callback_data: cb('lnr', n.id),
    },
  ])
  buttons.push([{ text: 'همه خوانده شد', callback_data: cb('lnra') }])
  await reply(
    ctx,
    `اعلان‌های خوانده‌نشده (${items.length})\nبرای خواندن متن کامل، روی اعلان بزنید.\n\n${lines.join('\n\n')}`,
    inlineKeyboard(buttons)
  )
}

async function showNotificationDetail(
  ctx: BotContext,
  user: User,
  notificationId: string,
  messageId?: number
): Promise<void> {
  const notification =
    (await notificationsRepo.markNotificationRead(user.id, notificationId)) ??
    (await notificationsRepo.getNotification(user.id, notificationId))
  if (!notification) {
    await reply(ctx, 'اعلان یافت نشد.', lawyerMainKeyboard())
    return
  }

  const text = formatChatbotNotificationHtml({
    heading: 'اعلان',
    title: notification.title,
    body: notification.body,
    createdAt: notification.createdAt,
  })

  const buttons: { text: string; callback_data: string }[][] = []
  if (notification.caseId) {
    buttons.push([
      {
        text: 'مشاهده پرونده',
        callback_data: cb('lc', notification.caseId),
      },
    ])
  }
  buttons.push([{ text: 'بازگشت به اعلان‌ها', callback_data: cb('lnl') }])

  const markup = inlineKeyboard(buttons)
  if (messageId) await editReply(ctx, messageId, text, markup)
  else await reply(ctx, text, markup)
}

export async function handleLawyerMessage(
  ctx: BotContext,
  user: User,
  message: TelegramMessage
): Promise<boolean> {
  const text = message.text?.trim() ?? ''
  const conversation = await conversationsRepo.getConversation(
    ctx.platform,
    ctx.chatId
  )

  if (text === '/start' || text === BTN.mainMenu) {
    await sendLawyerHome(ctx, user)
    return true
  }
  if (text === BTN.unlink || text === '/logout') {
    await unlinkAccount(ctx)
    return true
  }
  if (text === BTN.cancel) {
    await conversationsRepo.clearConversation(ctx.platform, ctx.chatId)
    await sendLawyerHome(ctx, user)
    return true
  }

  // FSM: add comment
  if (conversation.state === 'lawyer_add_comment') {
    const caseId = String(conversation.context.caseId ?? '')
    if (!caseId || !text) {
      await reply(ctx, 'متن نظر را وارد کنید یا لغو کنید.', cancelOnlyKeyboard())
      return true
    }
    const bodyHtml = `<p>${esc(text)}</p>`
    const comment = await casesRepo.addComment(ownerId(user), caseId, {
      bodyHtml,
      authorName: displayName(user),
      authorId: user.id,
    })
    await conversationsRepo.clearConversation(ctx.platform, ctx.chatId)
    if (!comment) {
      await reply(ctx, 'ثبت نظر ناموفق بود.', lawyerMainKeyboard())
    } else {
      await reply(ctx, 'نظر ثبت شد.', lawyerMainKeyboard())
      await showCaseDetail(ctx, user, caseId)
    }
    return true
  }

  // FSM: add payment amount
  if (conversation.state === 'lawyer_add_payment') {
    const caseId = String(conversation.context.caseId ?? '')
    const amount = Number(text.replace(/[^\d.]/g, ''))
    if (!caseId || !Number.isFinite(amount) || amount <= 0) {
      await reply(ctx, 'مبلغ معتبر وارد کنید (ریال).', cancelOnlyKeyboard())
      return true
    }
    const payment = await casesRepo.addPayment(ownerId(user), caseId, {
      amount,
      date: new Date().toISOString().slice(0, 10),
      method: 'transfer',
      source: 'manual',
      status: 'completed',
    })
    await conversationsRepo.clearConversation(ctx.platform, ctx.chatId)
    await reply(
      ctx,
      payment ? `پرداخت ${formatMoney(amount)} ثبت شد.` : 'ثبت پرداخت ناموفق بود.',
      lawyerMainKeyboard()
    )
    return true
  }

  // FSM: add expense — title then amount
  if (conversation.state === 'lawyer_add_expense_title') {
    const caseId = String(conversation.context.caseId ?? '')
    if (!caseId || !text) {
      await reply(ctx, 'عنوان هزینه را وارد کنید.', cancelOnlyKeyboard())
      return true
    }
    await conversationsRepo.setConversation(
      ctx.platform,
      ctx.chatId,
      'lawyer_add_expense_amount',
      { caseId, title: text }
    )
    await reply(ctx, 'مبلغ هزینه را به ریال وارد کنید:', cancelOnlyKeyboard())
    return true
  }

  if (conversation.state === 'lawyer_add_expense_amount') {
    const caseId = String(conversation.context.caseId ?? '')
    const title = String(conversation.context.title ?? 'هزینه')
    const amount = Number(text.replace(/[^\d.]/g, ''))
    if (!caseId || !Number.isFinite(amount) || amount <= 0) {
      await reply(ctx, 'مبلغ معتبر وارد کنید.', cancelOnlyKeyboard())
      return true
    }
    const expense = await casesRepo.addExpense(ownerId(user), caseId, {
      title,
      category: 'other',
      amount,
      date: new Date().toISOString().slice(0, 10),
    })
    await conversationsRepo.clearConversation(ctx.platform, ctx.chatId)
    await reply(
      ctx,
      expense ? `هزینه ثبت شد.` : 'ثبت هزینه ناموفق بود.',
      lawyerMainKeyboard()
    )
    return true
  }

  switch (text) {
    case BTN.cases:
      await listCasesPage(ctx, user, 1)
      return true
    case BTN.clients:
      await listClientsPage(ctx, user, 1)
      return true
    case BTN.consultations:
      await listConsultations(ctx, user)
      return true
    case BTN.events:
      await listEvents(ctx, user)
      return true
    case BTN.financial:
      await showFinancial(ctx, user)
      return true
    case BTN.stats:
      await showStats(ctx, user)
      return true
    case BTN.notifications:
      await showNotifications(ctx, user)
      return true
    default:
      await reply(
        ctx,
        'از دکمه‌های منو استفاده کنید.',
        lawyerMainKeyboard()
      )
      return true
  }
}

export async function handleLawyerCallback(
  ctx: BotContext,
  user: User,
  query: TelegramCallbackQuery
): Promise<boolean> {
  const data = query.data ?? ''
  const messageId = query.message?.message_id
  await ackCallback(ctx, query.id)

  const [action, a, b] = data.split(':')

  switch (action) {
    case 'home':
      await sendLawyerHome(ctx, user)
      return true
    case 'lcp':
      await listCasesPage(ctx, user, Number(a) || 1, messageId)
      return true
    case 'lc':
      if (a) await showCaseDetail(ctx, user, a, messageId)
      return true
    case 'lcs':
      if (a && messageId) await showStatusPicker(ctx, a, messageId)
      return true
    case 'lcss': {
      if (!a || !b) return true
      const status = b as CaseStatus
      if (!CASE_STATUSES.includes(status)) return true
      const updated = await casesRepo.updateCase(ownerId(user), a, { status })
      if (!updated) {
        await reply(ctx, 'به‌روزرسانی وضعیت ناموفق بود.')
      } else {
        await showCaseDetail(ctx, user, a, messageId)
      }
      return true
    }
    case 'lcc':
      if (!a) return true
      await conversationsRepo.setConversation(
        ctx.platform,
        ctx.chatId,
        'lawyer_add_comment',
        { caseId: a }
      )
      await reply(ctx, 'متن نظر را بنویسید:', cancelOnlyKeyboard())
      return true
    case 'lcpay':
      if (!a) return true
      await conversationsRepo.setConversation(
        ctx.platform,
        ctx.chatId,
        'lawyer_add_payment',
        { caseId: a }
      )
      await reply(ctx, 'مبلغ پرداخت را به ریال وارد کنید:', cancelOnlyKeyboard())
      return true
    case 'lcexp':
      if (!a) return true
      await conversationsRepo.setConversation(
        ctx.platform,
        ctx.chatId,
        'lawyer_add_expense_title',
        { caseId: a }
      )
      await reply(ctx, 'عنوان هزینه را وارد کنید:', cancelOnlyKeyboard())
      return true
    case 'lclp':
      await listClientsPage(ctx, user, Number(a) || 1, messageId)
      return true
    case 'lcl':
      if (a) await showClientDetail(ctx, user, a, messageId)
      return true
    case 'lcrl':
      await listConsultations(ctx, user, messageId)
      return true
    case 'lcr':
      if (a) await showConsultation(ctx, user, a, messageId)
      return true
    case 'lcrs': {
      if (!a || !b) return true
      const status = b as 'in_review' | 'contacted' | 'closed'
      const updated = await consultationsRepo.updateConsultationRequest(
        ownerId(user),
        a,
        {
          status,
          contactedAt: status === 'contacted' ? new Date().toISOString() : undefined,
        }
      )
      if (!updated) await reply(ctx, 'به‌روزرسانی ناموفق بود.')
      else await showConsultation(ctx, user, a, messageId)
      return true
    }
    case 'lev':
      if (a) await showEvent(ctx, user, a, messageId)
      return true
    case 'lnr':
      if (a) await showNotificationDetail(ctx, user, a, messageId)
      return true
    case 'lnl':
      await showNotifications(ctx, user)
      return true
    case 'lnra':
      await notificationsRepo.markAllNotificationsRead(user.id)
      await reply(ctx, 'همه اعلان‌ها خوانده شدند.', lawyerMainKeyboard())
      return true
    default:
      return false
  }
}
