'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { IconBale, IconRubika, IconTelegram } from '@/assets/brand-icons'
import { Button } from '@/components/ui/button'
import type { MessengerPlatform } from '@/features/settings-admin/types'
import { MESSENGER_LABELS } from '@/features/settings-admin/types'
import { DEMO_MESSENGER_PLATFORMS } from '@/server/messenger/rubika/feature'

export type DeepLinkResponse =
  | {
      enabled: true
      botUsername: string
      url: string
      mode?: 'webhook' | 'polling'
    }
  | {
      enabled: false
      botUsername: null
      url: null
    }

/** Demo-gated list (Rubika hidden while RUBIKA_CHATBOT_ENABLED is false). */
export const MESSENGER_PLATFORMS: MessengerPlatform[] = [
  ...DEMO_MESSENGER_PLATFORMS,
]

type MessengerBotEntryProps = {
  platform: MessengerPlatform
  className?: string
  /** Compact row for headers; default is a promotional card */
  variant?: 'card' | 'compact'
  /**
   * When provided by a parent (e.g. ChatbotEntries), skips the per-platform fetch
   * so siblings appear together without layout jump.
   */
  data?: DeepLinkResponse | null
  /** Parent is still loading aggregated deep-links */
  loading?: boolean
}

const THEME: Record<
  MessengerPlatform,
  {
    accent: string
    border: string
    bg: string
    iconBg: string
    Icon: typeof IconTelegram
  }
> = {
  telegram: {
    accent: '#2AABEE',
    border: 'border-[#2AABEE]/25',
    bg: 'bg-gradient-to-l from-[#2AABEE]/10 via-card to-card',
    iconBg: 'bg-[#2AABEE]/15 text-[#2AABEE]',
    Icon: IconTelegram,
  },
  bale: {
    accent: '#0CB689',
    border: 'border-[#0CB689]/25',
    bg: 'bg-gradient-to-l from-[#0CB689]/10 via-card to-card',
    iconBg: 'bg-[#0CB689]/15 text-[#0CB689]',
    Icon: IconBale,
  },
  rubika: {
    accent: '#7B2D8E',
    border: 'border-[#7B2D8E]/25',
    bg: 'bg-gradient-to-l from-[#7B2D8E]/10 via-card to-card',
    iconBg: 'bg-[#7B2D8E]/15 text-[#7B2D8E]',
    Icon: IconRubika,
  },
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-[88px] items-center gap-2 rounded-2xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground sm:h-[96px] sm:px-5',
        className
      )}
      aria-hidden
    >
      <Loader2 className='size-4 shrink-0 animate-spin' />
      <span>در حال بررسی چت‌بات…</span>
    </div>
  )
}

export function MessengerBotEntry({
  platform,
  className,
  variant = 'card',
  data: dataProp,
  loading: loadingProp,
}: MessengerBotEntryProps) {
  const controlled = dataProp !== undefined
  const [fetched, setFetched] = useState<DeepLinkResponse | null>(null)
  const [fetching, setFetching] = useState(!controlled)
  const theme = THEME[platform]
  const label = MESSENGER_LABELS[platform]
  const Icon = theme.Icon

  useEffect(() => {
    if (controlled) return
    let cancelled = false
    setFetching(true)
    void (async () => {
      const result = await api<DeepLinkResponse>(
        `/api/messenger/${platform}/deep-link`
      )
      if (cancelled) return
      if (result.ok) setFetched(result.data)
      else setFetched({ enabled: false, botUsername: null, url: null })
      setFetching(false)
    })()
    return () => {
      cancelled = true
    }
  }, [platform, controlled])

  const loading = controlled ? Boolean(loadingProp) : fetching
  const data = controlled ? dataProp : fetched

  if (loading) {
    if (variant === 'compact') return null
    return <CardSkeleton className={className} />
  }

  if (!data?.enabled || !data.url) return null

  if (variant === 'compact') {
    return (
      <Button
        variant='outline'
        size='sm'
        className={cn(
          'h-9 gap-2 border bg-background/80 px-3 shadow-none transition-colors',
          theme.border,
          'hover:bg-muted/60',
          className
        )}
        asChild
      >
        <a href={data.url} target='_blank' rel='noopener noreferrer'>
          <span
            className={cn(
              'flex size-5 items-center justify-center rounded-md',
              theme.iconBg
            )}
          >
            <Icon className='size-3.5' />
          </span>
          چت‌بات {label}
          <ExternalLink className='size-3.5 opacity-50' />
        </a>
      </Button>
    )
  }

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border',
        theme.border,
        theme.bg,
        className
      )}
    >
      <div className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5'>
        <div className='flex items-start gap-3'>
          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl',
              theme.iconBg
            )}
          >
            <Icon className='size-6' />
          </div>
          <div className='space-y-1'>
            <h2 className='text-base font-semibold tracking-tight'>
              چت‌بات {label} وکیل‌آ
            </h2>
            <p className='max-w-xl text-sm leading-relaxed text-muted-foreground'>
              بدون وارد کردن دوباره شماره و کد تأیید، از داشبورد وارد بات شوید و
              پرونده‌ها و کارهایتان را در {label} مدیریت کنید.
              {data.botUsername ? (
                <>
                  {' '}
                  <span dir='ltr' className='font-mono text-foreground'>
                    @{data.botUsername}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>
        <Button
          className='w-full shrink-0 gap-2 text-white sm:w-auto'
          style={{ backgroundColor: theme.accent }}
          asChild
        >
          <a href={data.url} target='_blank' rel='noopener noreferrer'>
            ورود به چت‌بات
            <ExternalLink className='size-4' />
          </a>
        </Button>
      </div>
    </section>
  )
}

/** @deprecated Prefer MessengerBotEntry with platform="telegram" */
export function TelegramBotEntry(
  props: Omit<MessengerBotEntryProps, 'platform'>
) {
  return <MessengerBotEntry platform='telegram' {...props} />
}

export function BaleBotEntry(
  props: Omit<MessengerBotEntryProps, 'platform'>
) {
  return <MessengerBotEntry platform='bale' {...props} />
}

export function RubikaBotEntry(
  props: Omit<MessengerBotEntryProps, 'platform'>
) {
  return <MessengerBotEntry platform='rubika' {...props} />
}
