'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BellOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificationListItem } from '@/features/notifications/components/notification-list-item'
import { useNotificationsHydration } from '@/features/notifications/hooks/use-notifications-hydration'
import { useNotificationsStore } from '@/features/notifications/stores/notifications-store'
import {
  getNotificationDateGroup,
  NOTIFICATION_GROUP_LABELS,
  type NotificationDateGroup,
} from '@/features/notifications/utils/format'
import type { Notification } from '@/features/notifications/types'

const GROUP_ORDER: NotificationDateGroup[] = [
  'today',
  'yesterday',
  'thisWeek',
  'older',
]

export function NotificationsFeedTab() {
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
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-base font-semibold tracking-tight text-sidebar-foreground'>
            اعلانات
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            فعالیت‌های مرتبط با پرونده‌ها و حساب شما در اینجا نمایش داده می‌شود.
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button
            variant='outline'
            size='sm'
            className='shrink-0 self-start'
            onClick={() => void handleMarkAllRead()}
          >
            همه را خواندم
          </Button>
        ) : null}
      </div>

      <div className='overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm'>
        <div className='border-b border-sidebar-border px-4 py-3 sm:px-5'>
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as 'all' | 'unread')}
          >
            <TabsList className='h-9 w-full bg-sidebar-accent/60 sm:w-auto'>
              <TabsTrigger value='all' className='flex-1 sm:flex-none'>
                همه
              </TabsTrigger>
              <TabsTrigger value='unread' className='flex-1 gap-1.5 sm:flex-none'>
                خوانده‌نشده
                {unreadCount > 0 ? (
                  <span className='rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground tabular-nums'>
                    {unreadCount.toLocaleString('fa-IR')}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className='px-4 py-4 sm:px-5 sm:py-5'>
          {loading && items.length === 0 ? (
            <div className='flex items-center justify-center py-16'>
              <Loader2 className='size-8 animate-spin text-muted-foreground' />
            </div>
          ) : items.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-3 py-12 text-center sm:py-16'>
              <div className='flex size-14 items-center justify-center rounded-2xl bg-muted sm:size-16'>
                <BellOff className='size-7 text-muted-foreground sm:size-8' />
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
                    <h3 className='text-xs font-medium text-muted-foreground'>
                      {NOTIFICATION_GROUP_LABELS[group]}
                    </h3>
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
        </div>
      </div>
    </div>
  )
}
