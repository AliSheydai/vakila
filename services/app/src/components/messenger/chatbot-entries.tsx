'use client'

import {
  BaleBotEntry,
  TelegramBotEntry,
} from '@/components/messenger/telegram-bot-entry'
import { cn } from '@/lib/utils'

type ChatbotEntriesProps = {
  variant?: 'card' | 'compact'
  className?: string
}

/**
 * Renders Telegram and Bale deep-link CTAs; each hides itself when that bot is off.
 */
export function ChatbotEntries({
  variant = 'card',
  className,
}: ChatbotEntriesProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <TelegramBotEntry variant='compact' />
        <BaleBotEntry variant='compact' />
      </div>
    )
  }

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      <TelegramBotEntry />
      <BaleBotEntry />
    </div>
  )
}
