'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import {
  type DeepLinkResponse,
  MESSENGER_PLATFORMS,
  MessengerBotEntry,
} from '@/components/messenger/telegram-bot-entry'
import type { MessengerPlatform } from '@/features/settings-admin/types'
import { useAuthStore } from '@/stores/auth-store'

type ChatbotEntriesProps = {
  variant?: 'card' | 'compact'
  className?: string
  /**
   * Change when messenger enable/username changes so deep-links refresh
   * without remounting individual buttons mid-load.
   */
  refreshKey?: string
}

type EntriesMap = Partial<Record<MessengerPlatform, DeepLinkResponse>>

/** In-flight dedupe only — signed URLs must never be TTL-cached across users. */
const inflightByCacheKey = new Map<string, Promise<EntriesMap>>()

export function invalidateChatbotDeepLinkCache(): void {
  inflightByCacheKey.clear()
}

async function fetchAllDeepLinks(cacheKey: string): Promise<EntriesMap> {
  const existing = inflightByCacheKey.get(cacheKey)
  if (existing) return existing

  const promise = Promise.all(
    MESSENGER_PLATFORMS.map(async (platform) => {
      const result = await api<DeepLinkResponse>(
        `/api/messenger/${platform}/deep-link`
      )
      const data: DeepLinkResponse = result.ok
        ? result.data
        : { enabled: false, botUsername: null, url: null }
      return [platform, data] as const
    })
  )
    .then((pairs) => Object.fromEntries(pairs) as EntriesMap)
    .finally(() => {
      inflightByCacheKey.delete(cacheKey)
    })

  inflightByCacheKey.set(cacheKey, promise)
  return promise
}

/**
 * Renders enabled messenger deep-link CTAs (Rubika gated off for demo).
 * Fetches all platforms together and reveals enabled entries in one paint
 * to avoid header/layout jump from staggered per-bot requests.
 */
export function ChatbotEntries({
  variant = 'card',
  className,
  refreshKey = 'default',
}: ChatbotEntriesProps) {
  const userId = useAuthStore((s) => s.auth.user?.id ?? null)
  const cacheKey = `${userId ?? 'anon'}::${refreshKey}`

  const [entries, setEntries] = useState<EntriesMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    void fetchAllDeepLinks(cacheKey).then((data) => {
      if (cancelled) return
      setEntries(data)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [cacheKey])

  const enabledPlatforms = MESSENGER_PLATFORMS.filter((platform) => {
    const entry = entries[platform]
    return Boolean(entry?.enabled && entry.url)
  })

  if (variant === 'compact') {
    // Hold the whole group until every platform resolved — no staggered pop-in.
    if (loading) return null
    if (enabledPlatforms.length === 0) return null

    return (
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 sm:justify-start',
          className
        )}
      >
        {enabledPlatforms.map((platform) => (
          <MessengerBotEntry
            key={platform}
            platform={platform}
            variant='compact'
            data={entries[platform] ?? null}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={cn('flex w-full flex-col gap-3', className)}>
        <div className='flex h-[88px] items-center gap-2 rounded-2xl border border-dashed border-border/70 px-4 text-sm text-muted-foreground sm:h-[96px] sm:px-5'>
          <Loader2 className='size-4 shrink-0 animate-spin' />
          در حال بررسی چت‌بات‌ها…
        </div>
      </div>
    )
  }

  if (enabledPlatforms.length === 0) return null

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      {enabledPlatforms.map((platform) => (
        <MessengerBotEntry
          key={platform}
          platform={platform}
          data={entries[platform] ?? null}
        />
      ))}
    </div>
  )
}
