'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { IconBale, IconTelegram } from '@/assets/brand-icons'
import { Button } from '@/components/ui/button'
import type { MessengerPlatform } from '@/features/settings-admin/types'
import { MESSENGER_LABELS } from '@/features/settings-admin/types'

type DeepLinkResponse =
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

type MessengerBotEntryProps = {
  platform: Extract<MessengerPlatform, 'telegram' | 'bale'>
  className?: string
  /** Compact row for headers; default is a promotional card */
  variant?: 'card' | 'compact'
}

const THEME: Record<
  'telegram' | 'bale',
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
}

export function MessengerBotEntry({
  platform,
  className,
  variant = 'card',
}: MessengerBotEntryProps) {
  const [data, setData] = useState<DeepLinkResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const theme = THEME[platform]
  const label = MESSENGER_LABELS[platform]
  const Icon = theme.Icon

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const result = await api<DeepLinkResponse>(
        `/api/messenger/${platform}/deep-link`
      )
      if (cancelled) return
      if (result.ok) setData(result.data)
      else setData({ enabled: false, botUsername: null, url: null })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [platform])

  if (loading) {
    if (variant === 'compact') return null
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground',
          className
        )}
      >
        <Loader2 className='size-4 animate-spin' />
        در حال بررسی چت‌بات…
      </div>
    )
  }

  if (!data?.enabled || !data.url) return null

  if (variant === 'compact') {
    return (
      <Button variant='outline' size='sm' className={cn('gap-2', className)} asChild>
        <a href={data.url} target='_blank' rel='noopener noreferrer'>
          <Icon className='size-4' />
          چت‌بات {label}
          <ExternalLink className='size-3.5 opacity-60' />
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
