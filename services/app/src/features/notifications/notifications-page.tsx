'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BellOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotificationsHydration } from './hooks/use-notifications-hydration'
import { useNotificationsStore } from './stores/notifications-store'
import { NotificationListItem } from './components/notification-list-item'
import {
  getNotificationDateGroup,
  NOTIFICATION_GROUP_LABELS,
  type NotificationDateGroup,
} from './utils/format'
import type { Notification } from './types'

const GROUP_ORDER: NotificationDateGroup[] = [
  'today',
  'yesterday',
  'thisWeek',
  'older',
]

export function NotificationsPage() {
  const router = useRouter()
  const { hydrated } = useNotificationsHydration()
  const items = useNotificationsStore((state) => state.items)
  const unreadCount = useNotificationsStore((state) => state.unreadCount)
  const loadItems = useNotificationsStore((state) => state.loadItems)
  const markRead = useNotificationsStore((state) => state.markRead)
  const markAllRead = useNotificationsStore((state) => state.markAllRead)

  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    await loadItems(filter === 'unread')
    setLoading(false)
  }, [filter, loadItems])

  useEffect(() => {
    if (!hydrated) return
    void reload()
  }, [hydrated, reload])

  const grouped = useMemo(() => {
    const map = new Map<NotificationDateGroup, Notification[]>()
    for (const group of GROUP_ORDER) {
      map.set(group, [])
    }
    for (const item of items) {
      const group = getNotificationDateGroup(item.createdAt)
      map.get(group)?.push(item)
    }
    return map
  }, [items])

  const handleMarkAllRead = async () => {
    const result = await markAllRead()
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('همه اعلان‌ها خوانده شد.')
    void reload()
  }

  return (
    <>
      <Header fixed>
        <Button
          variant='ghost'
          size='sm'
          className='-ms-2'
          onClick={() => router.back()}
        >
          بازگشت
        </Button>
        <h1 className='font-display text-base font-semibold'>اعلانات</h1>
        <div className='ms-auto flex items-center gap-2'>
          {unreadCount > 0 ? (
            <Button variant='outline' size='sm' onClick={() => void handleMarkAllRead()}>
              همه را خواندم
            </Button>
          ) : null}
          <Search />
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 pb-8'>
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as 'all' | 'unread')}
        >
          <TabsList>
            <TabsTrigger value='all'>همه</TabsTrigger>
            <TabsTrigger value='unread'>
              خوانده‌نشده
              {unreadCount > 0 ? (
                <span className='ms-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground tabular-nums'>
                  {unreadCount.toLocaleString('fa-IR')}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading && items.length === 0 ? (
          <div className='flex flex-1 items-center justify-center py-16'>
            <Loader2 className='size-8 animate-spin text-muted-foreground' />
          </div>
        ) : items.length === 0 ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center'>
            <div className='flex size-16 items-center justify-center rounded-2xl bg-muted'>
              <BellOff className='size-8 text-muted-foreground' />
            </div>
            <div>
              <p className='font-medium'>اعلانی ندارید</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                {filter === 'unread'
                  ? 'همه اعلان‌ها را خوانده‌اید.'
                  : 'وقتی فعالیتی انجام شود، اینجا نمایش داده می‌شود.'}
              </p>
            </div>
          </div>
        ) : (
          <div className='space-y-6'>
            {GROUP_ORDER.map((group) => {
              const groupItems = grouped.get(group) ?? []
              if (groupItems.length === 0) return null

              return (
                <section key={group} className='space-y-3'>
                  <h2 className='text-xs font-medium text-muted-foreground'>
                    {NOTIFICATION_GROUP_LABELS[group]}
                  </h2>
                  <div className='space-y-2'>
                    {groupItems.map((notification) => (
                      <NotificationListItem
                        key={notification.id}
                        notification={notification}
                        onRead={async (id) => {
                          await markRead(id)
                          if (filter === 'unread') {
                            void reload()
                          }
                        }}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </Main>
    </>
  )
}
