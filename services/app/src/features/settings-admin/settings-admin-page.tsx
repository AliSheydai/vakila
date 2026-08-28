'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Loader2, MessageCircle, RotateCcw } from 'lucide-react'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  AdminSettingsData,
  MessengerTokenStatus,
  NotificationDeliverySettings,
} from './types'
import { MessengersTab } from './components/messengers-tab'
import { NotificationsTab } from './components/notifications-tab'

export function SettingsAdminPage() {
  const [data, setData] = useState<AdminSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await api<AdminSettingsData>('/api/settings')
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setData(result.data)
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  function handleMessengerSaved(
    status: MessengerTokenStatus,
    notificationDelivery?: NotificationDeliverySettings
  ) {
    setData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        messengers: prev.messengers.map((m) =>
          m.platform === status.platform ? status : m
        ),
        ...(notificationDelivery
          ? { notificationDelivery }
          : {}),
      }
    })
  }

  function handleNotificationSaved(settings: NotificationDeliverySettings) {
    setData((prev) => {
      if (!prev) return prev
      return { ...prev, notificationDelivery: settings }
    })
  }

  return (
    <>
      <Header>
        <Search className='me-auto' />
        <ThemeSwitch />
      </Header>

      <Main>
        <div className='mx-auto w-full max-w-2xl space-y-8'>
          <div className='space-y-1'>
            <h1 className='font-display text-2xl font-bold tracking-tight text-sidebar-foreground md:text-3xl'>
              تنظیمات
            </h1>
            <p className='text-sm text-muted-foreground md:text-base'>
              اتصال پیام‌رسان‌ها و نحوه اطلاع‌رسانی به موکل را مدیریت کنید.
            </p>
          </div>

          {loading ? (
            <div className='space-y-4'>
              <Skeleton className='h-10 w-full rounded-xl' />
              <Skeleton className='h-48 w-full rounded-xl' />
              <Skeleton className='h-48 w-full rounded-xl' />
            </div>
          ) : error ? (
            <div className='space-y-4 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-6 text-center'>
              <p className='text-sm text-destructive'>{error}</p>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => void loadSettings()}
              >
                <RotateCcw className='size-4' />
                تلاش مجدد
              </Button>
            </div>
          ) : data ? (
            <Tabs defaultValue='messengers' className='gap-6'>
              <TabsList className='grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-sidebar-border bg-sidebar p-1 text-sidebar-foreground'>
                <TabsTrigger
                  value='messengers'
                  className='gap-1.5 rounded-lg px-2 py-2.5 text-xs text-muted-foreground data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-sidebar-accent sm:text-sm'
                >
                  <MessageCircle className='size-4 shrink-0' />
                  <span>پیام‌رسان‌ها</span>
                </TabsTrigger>
                <TabsTrigger
                  value='notifications'
                  className='gap-1.5 rounded-lg px-2 py-2.5 text-xs text-muted-foreground data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-sidebar-accent sm:text-sm'
                >
                  <Bell className='size-4 shrink-0' />
                  <span>اعلان‌ها</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value='messengers'
                className='mt-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-200 focus-visible:ring-0'
              >
                <MessengersTab
                  messengers={data.messengers}
                  onMessengerSaved={handleMessengerSaved}
                />
              </TabsContent>

              <TabsContent
                value='notifications'
                className='mt-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-200 focus-visible:ring-0'
              >
                <NotificationsTab
                  settings={data.notificationDelivery}
                  messengers={data.messengers}
                  smsConfigured={data.smsConfigured}
                  onSaved={handleNotificationSaved}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div className='flex items-center justify-center py-12 text-muted-foreground'>
              <Loader2 className='size-5 animate-spin' />
            </div>
          )}
        </div>
      </Main>
    </>
  )
}
