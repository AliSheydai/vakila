import { requestOtp, verifyOtp } from '@/server/auth/otp'
import { isValidIranianMobile, toLocalDisplay } from '@/server/phone'
import * as conversationsRepo from '@/server/repositories/messenger-conversations-repo'
import * as linksRepo from '@/server/repositories/messenger-links-repo'
import type { User } from '@/server/types'
import type { TelegramMessage } from '../api'
import {
  type BotContext,
  displayName,
  isLawyerRole,
  reply,
} from '../context'
import { allowRate } from '../rate-limit'
import {
  BTN,
  cancelOnlyKeyboard,
  clientMainKeyboard,
  guestKeyboard,
  lawyerMainKeyboard,
  phoneRequestKeyboard,
} from '../keyboards'

const PLATFORM = 'telegram' as const

export async function sendWelcome(
  ctx: BotContext,
  user: User | null
): Promise<void> {
  if (user) {
    const menu = isLawyerRole(user.role)
      ? lawyerMainKeyboard()
      : clientMainKeyboard()
    await reply(
      ctx,
      `سلام ${displayName(user)} 👋\nبه پنل چت‌بات وکیل‌آ خوش آمدید.\nاز منو یکی از بخش‌ها را انتخاب کنید.`,
      menu
    )
    return
  }

  await reply(
    ctx,
    'به چت‌بات <b>وکیل‌آ</b> خوش آمدید.\nبرای دسترسی به داشبورد، حساب خود را با شماره موبایل متصل کنید.',
    guestKeyboard()
  )
}

export async function startLinkFlow(ctx: BotContext): Promise<void> {
  await conversationsRepo.setConversation(PLATFORM, ctx.chatId, 'await_phone', {})
  await reply(
    ctx,
    'شماره موبایل ایران خود را ارسال کنید (مثلاً ۰۹۱۲۱۲۳۴۵۶۷) یا دکمهٔ زیر را بزنید.',
    phoneRequestKeyboard()
  )
}

export async function unlinkAccount(ctx: BotContext): Promise<void> {
  await linksRepo.revokeLink(PLATFORM, ctx.chatId)
  await conversationsRepo.clearConversation(PLATFORM, ctx.chatId)
  ctx.user = null
  await reply(
    ctx,
    'اتصال حساب قطع شد. برای استفاده مجدد، دوباره متصل شوید.',
    guestKeyboard()
  )
}

function extractPhone(message: TelegramMessage): string | null {
  if (message.contact?.phone_number) {
    let phone = message.contact.phone_number.replace(/\s+/g, '')
    if (phone.startsWith('+98')) phone = `0${phone.slice(3)}`
    if (phone.startsWith('98') && phone.length >= 12) phone = `0${phone.slice(2)}`
    return phone
  }
  const text = message.text?.trim()
  if (!text) return null
  return text.replace(/[^\d+]/g, '')
}

export async function handleGuestMessage(
  ctx: BotContext,
  message: TelegramMessage
): Promise<boolean> {
  const text = message.text?.trim() ?? ''
  const conversation = await conversationsRepo.getConversation(
    PLATFORM,
    ctx.chatId
  )

  if (text === '/start' || text.startsWith('/start ') || text === BTN.connect) {
    // Deep-link payloads are handled in router; plain /start here is guest-only
    if (text === '/start' || text.startsWith('/start ')) {
      await sendWelcome(ctx, null)
      return true
    }
    await startLinkFlow(ctx)
    return true
  }

  if (text === BTN.cancel) {
    await conversationsRepo.clearConversation(PLATFORM, ctx.chatId)
    await sendWelcome(ctx, null)
    return true
  }

  if (conversation.state === 'await_phone') {
    const raw = extractPhone(message)
    if (!raw || !isValidIranianMobile(raw)) {
      await reply(
        ctx,
        'شماره موبایل معتبر نیست. یک شماره ایران مثل ۰۹۱۲۱۲۳۴۵۶۷ وارد کنید.',
        phoneRequestKeyboard()
      )
      return true
    }

    if (!allowRate(`otp:${ctx.chatId}`, 3, 10 * 60 * 1000)) {
      await reply(ctx, 'تعداد درخواست کد بیش از حد است. کمی بعد دوباره تلاش کنید.')
      return true
    }

    const phone = toLocalDisplay(raw)
    try {
      await requestOtp(phone)
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'ارسال کد با خطا مواجه شد.'
      await reply(ctx, msg, phoneRequestKeyboard())
      return true
    }

    await conversationsRepo.setConversation(PLATFORM, ctx.chatId, 'await_otp', {
      phone,
    })
    await reply(
      ctx,
      `کد تأیید به ${phone} پیامک شد.\nکد را اینجا وارد کنید.`,
      cancelOnlyKeyboard()
    )
    return true
  }

  if (conversation.state === 'await_otp') {
    if (!/^\d{4,8}$/.test(text)) {
      await reply(ctx, 'کد تأیید باید عددی باشد.', cancelOnlyKeyboard())
      return true
    }

    const phone = String(conversation.context.phone ?? '')
    if (!phone) {
      await startLinkFlow(ctx)
      return true
    }

    try {
      const result = await verifyOtp(phone, text)
      await linksRepo.linkChatToUser({
        platform: PLATFORM,
        chatId: ctx.chatId,
        userId: result.user.id,
        phone: result.user.phone,
      })
      await conversationsRepo.clearConversation(PLATFORM, ctx.chatId)
      ctx.user = result.user

      let extra = ''
      if (result.isNew) {
        extra = '\nحساب جدید با نقش موکل برای شما ساخته شد.'
      } else if (result.needsName) {
        extra = '\nمی‌توانید نام خود را بعداً از پورتال وب تکمیل کنید.'
      }

      const menu = isLawyerRole(result.user.role)
        ? lawyerMainKeyboard()
        : clientMainKeyboard()

      await reply(
        ctx,
        `حساب با موفقیت متصل شد.${extra}\nخوش آمدید ${displayName(result.user)}.`,
        menu
      )
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'تأیید کد ناموفق بود.'
      await reply(ctx, msg, cancelOnlyKeyboard())
    }
    return true
  }

  // Unknown guest input
  await sendWelcome(ctx, null)
  return true
}
