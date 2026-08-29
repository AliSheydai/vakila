import { requestOtp, verifyOtp } from '@/server/auth/otp'
import {
  getUserById,
  isTotpEnabledForUser,
  verifyUserTotp,
} from '@/server/auth/totp'
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
  await conversationsRepo.setConversation(ctx.platform, ctx.chatId, 'await_phone', {})
  await reply(
    ctx,
    'شماره موبایل ایران خود را ارسال کنید (مثلاً ۰۹۱۲۱۲۳۴۵۶۷) یا دکمهٔ زیر را بزنید.',
    phoneRequestKeyboard()
  )
}

export async function unlinkAccount(ctx: BotContext): Promise<void> {
  await linksRepo.revokeLink(ctx.platform, ctx.chatId)
  await conversationsRepo.clearConversation(ctx.platform, ctx.chatId)
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
    ctx.platform,
    ctx.chatId
  )

  if (text === BTN.connect) {
    await startLinkFlow(ctx)
    return true
  }

  // Deep-link /start <payload> must be handled by the router; if it reaches here
  // the token was missing/invalid — do not swallow it as a plain welcome.
  if (/^\/start(?:@\w+)?\s+\S+/i.test(text)) {
    await reply(
      ctx,
      'لینک ورود منقضی یا نامعتبر است.\nاز داشبورد سایت دوباره «ورود به چت‌بات» را بزنید، یا با شماره موبایل متصل شوید.',
      guestKeyboard()
    )
    return true
  }

  if (text === '/start') {
    await sendWelcome(ctx, null)
    return true
  }

  if (text === BTN.cancel) {
    await conversationsRepo.clearConversation(ctx.platform, ctx.chatId)
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

    await conversationsRepo.setConversation(ctx.platform, ctx.chatId, 'await_otp', {
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

      if (await isTotpEnabledForUser(result.user.id)) {
        await conversationsRepo.setConversation(
          ctx.platform,
          ctx.chatId,
          'await_totp',
          {
            userId: result.user.id,
            phone: result.user.phone,
            isNew: result.isNew,
            needsName: result.needsName,
          }
        )
        await reply(
          ctx,
          'ورود دو مرحله‌ای برای این حساب فعال است.\nکد ۶ رقمی Google Authenticator را وارد کنید.',
          cancelOnlyKeyboard()
        )
        return true
      }

      await finishGuestLink(ctx, {
        user: result.user,
        isNew: result.isNew,
        needsName: result.needsName,
      })
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'تأیید کد ناموفق بود.'
      await reply(ctx, msg, cancelOnlyKeyboard())
    }
    return true
  }

  if (conversation.state === 'await_totp') {
    if (!/^\d{6}$/.test(text)) {
      await reply(
        ctx,
        'کد ورود دو مرحله‌ای باید ۶ رقم باشد.',
        cancelOnlyKeyboard()
      )
      return true
    }

    const userId = String(conversation.context.userId ?? '')
    if (!userId) {
      await startLinkFlow(ctx)
      return true
    }

    const valid = await verifyUserTotp(userId, text)
    if (!valid) {
      await reply(ctx, 'کد تأیید نادرست است.', cancelOnlyKeyboard())
      return true
    }

    const user = await getUserById(userId)
    if (!user || !user.is_active) {
      await reply(ctx, 'این حساب غیرفعال است.', guestKeyboard())
      await conversationsRepo.clearConversation(ctx.platform, ctx.chatId)
      return true
    }

    await finishGuestLink(ctx, {
      user,
      isNew: Boolean(conversation.context.isNew),
      needsName: Boolean(conversation.context.needsName),
    })
    return true
  }

  // Unknown guest input
  await sendWelcome(ctx, null)
  return true
}

async function finishGuestLink(
  ctx: BotContext,
  result: { user: User; isNew: boolean; needsName: boolean }
): Promise<void> {
  await linksRepo.linkChatToUser({
    platform: ctx.platform,
    chatId: ctx.chatId,
    userId: result.user.id,
    phone: result.user.phone,
  })
  await conversationsRepo.clearConversation(ctx.platform, ctx.chatId)
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
}
