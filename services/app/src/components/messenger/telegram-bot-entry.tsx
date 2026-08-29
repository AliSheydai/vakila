'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { IconTelegram } from '@/assets/brand-icons'
import { Button } from '@/components/ui/button'

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

type TelegramBotEntryProps = {
  className?: string
  /** Compact row for headers; default is a promotional card */
  variant?: 'card' | 'compact'
}

export function TelegramBotEntry({
  className,
  variant = 'card',
}: TelegramBotEntryProps) {
  const [data, setData] = useState<DeepLinkResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const result = await api<DeepLinkResponse>(
        '/api/messenger/telegram/deep-link'
      )
      if (cancelled) return
      if (result.ok) setData(result.data)
      else setData({ enabled: false, botUsername: null, url: null })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

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
          <IconTelegram className='size-4' />
          چت‌بات تلگرام
          <ExternalLink className='size-3.5 opacity-60' />
        </a>
      </Button>
    )
  }

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-[#2AABEE]/25 bg-gradient-to-l from-[#2AABEE]/10 via-card to-card',
        className
      )}
    >
      <div className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5'>
        <div className='flex items-start gap-3'>
          <div className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#2AABEE]/15 text-[#2AABEE]'>
            <IconTelegram className='size-6' />
          </div>
          <div className='space-y-1'>
            <h2 className='text-base font-semibold tracking-tight'>
              چت‌بات تلگرام وکیل‌آ
            </h2>
            <p className='max-w-xl text-sm leading-relaxed text-muted-foreground'>
              بدون وارد کردن دوباره شماره و کد تأیید، از داشبورد وارد بات شوید و
              پرونده‌ها و کارهایتان را در تلگرام مدیریت کنید.
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
          className='w-full shrink-0 gap-2 bg-[#2AABEE] text-white hover:bg-[#229ED9] sm:w-auto'
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
