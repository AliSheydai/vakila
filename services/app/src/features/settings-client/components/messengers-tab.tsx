'use client'

import { useEffect, useState } from 'react'
import { Bot, MessageCircle } from 'lucide-react'
import { api } from '@/lib/api-client'
import { Skeleton } from '@/components/ui/skeleton'
import { ChatbotEntries } from '@/components/messenger/chatbot-entries'

type DeepLinkStatus = {
  loading: boolean
  hasAny: boolean
}

function useDeepLinkAvailability(): DeepLinkStatus {
  const [status, setStatus] = useState<DeepLinkStatus>({
    loading: true,
    hasAny: false,
  })

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const [telegram, bale] = await Promise.all([
        api<{ enabled: boolean }>('/api/messenger/telegram/deep-link'),
        api<{ enabled: boolean }>('/api/messenger/bale/deep-link'),
      ])

      if (cancelled) return

      const telegramReady = telegram.ok && telegram.data.enabled
      const baleReady = bale.ok && bale.data.enabled

      setStatus({
        loading: false,
        hasAny: telegramReady || baleReady,
      })
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return status
}

export function ClientMessengersTab() {
  const { loading, hasAny } = useDeepLinkAvailability()

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h2 className='text-base font-semibold tracking-tight text-sidebar-foreground'>
          پیام‌رسان‌ها
        </h2>
        <p className='text-sm text-muted-foreground'>
          اگر وکیل یا مدیر چت‌بات فعال کرده باشد، می‌توانید بدون وارد کردن دوباره
          شماره و کد تأیید از اینجا وارد بات شوید.
        </p>
      </div>

      {loading ? (
        <div className='space-y-3'>
          <Skeleton className='h-28 w-full rounded-2xl' />
          <Skeleton className='h-28 w-full rounded-2xl' />
        </div>
      ) : hasAny ? (
        <ChatbotEntries />
      ) : (
        <div className='flex flex-col items-center gap-4 rounded-2xl border border-dashed border-sidebar-border bg-muted/20 px-6 py-12 text-center'>
          <div className='flex size-14 items-center justify-center rounded-2xl bg-muted'>
            <Bot className='size-7 text-muted-foreground' />
          </div>
          <div className='max-w-md space-y-2'>
            <p className='text-base font-medium text-sidebar-foreground'>
              چت‌بات فعالی وجود ندارد
            </p>
            <p className='text-sm leading-relaxed text-muted-foreground'>
              در حال حاضر هیچ چت‌باتی برای پیام‌رسان‌ها فعال نشده است. پس از
              پیکربندی توسط مدیر، دکمه‌های ورود مستقیم در این بخش نمایش داده
              می‌شوند.
            </p>
          </div>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <MessageCircle className='size-4 shrink-0' />
            <span>می‌توانید از اعلان‌های داخل پورتال استفاده کنید.</span>
          </div>
        </div>
      )}
    </div>
  )
}
