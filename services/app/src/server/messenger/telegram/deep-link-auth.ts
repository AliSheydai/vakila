import * as conversationsRepo from '@/server/repositories/messenger-conversations-repo'
import * as linksRepo from '@/server/repositories/messenger-links-repo'
import * as usersRepo from '@/server/repositories/users-repo'
import {
  type BotContext,
  displayName,
  isLawyerRole,
  reply,
} from './context'
import { verifyBotStartPayload } from './deep-link'
import {
  clientMainKeyboard,
  lawyerMainKeyboard,
} from './keyboards'

export type DeepLinkResult = 'linked' | 'invalid' | 'none'

/**
 * If `/start <payload>` carries a valid dashboard deep-link token,
 * link this chat to that user and return 'linked' (skips OTP).
 */
export async function tryDeepLinkLogin(
  ctx: BotContext,
  text: string
): Promise<DeepLinkResult> {
  const match = text.match(/^\/start(?:@\w+)?(?:\s+(\S+))?$/i)
  const rawPayload = match?.[1]?.trim()
  if (!rawPayload) return 'none'

  const userId = verifyBotStartPayload(ctx.platform, rawPayload)
  if (!userId) {
    await reply(
      ctx,
      'لینک ورود منقضی یا نامعتبر است.\nاز داشبورد سایت دوباره «ورود به چت‌بات» را بزنید، یا با شماره موبایل متصل شوید.'
    )
    return 'invalid'
  }

  const user = await usersRepo.getUserById(userId)
  if (!user || !user.is_active) {
    await reply(ctx, 'حساب مرتبط با این لینک یافت نشد یا غیرفعال است.')
    return 'invalid'
  }

  await linksRepo.linkChatToUser({
    platform: ctx.platform,
    chatId: ctx.chatId,
    userId: user.id,
    phone: user.phone,
  })
  await conversationsRepo.clearConversation(ctx.platform, ctx.chatId)
  ctx.user = user

  const menu = isLawyerRole(user.role)
    ? lawyerMainKeyboard()
    : clientMainKeyboard()

  await reply(
    ctx,
    `خوش آمدید ${displayName(user)} 👋\nحساب شما از داشبورد متصل شد. منوی پنل آماده است.`,
    menu
  )

  return 'linked'
}
