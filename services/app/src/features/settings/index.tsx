'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Bell, MonitorSmartphone, Shield, UserRound } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { accountPath } from '@/lib/account-routes'
import { useNotificationsBadge } from '@/features/notifications/hooks/use-notifications-hydration'
import { useAuthStore } from '@/stores/auth-store'
import { ProfileTab } from './components/profile-tab'
import { SessionsTab } from './components/sessions-tab'
import { SecurityTab } from './components/security-tab'
import { NotificationsFeedTab } from './components/notifications-feed-tab'

const ACCOUNT_TABS = ['profile', 'sessions', 'security', 'notifications'] as const

type AccountTab = (typeof ACCOUNT_TABS)[number]

function parseAccountTab(value: string | null): AccountTab {
  if (value && (ACCOUNT_TABS as readonly string[]).includes(value)) {
    return value as AccountTab
  }
  return 'profile'
}

export function Settings() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = useAuthStore((s) => s.auth.user?.role)
  const basePath = accountPath(role)
  const unreadCount = useNotificationsBadge()

  const initialTab = useMemo(
    () => parseAccountTab(searchParams.get('tab')),
    [searchParams]
  )
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab)

  useEffect(() => {
    setActiveTab(parseAccountTab(searchParams.get('tab')))
  }, [searchParams])

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = parseAccountTab(value)
      setActiveTab(tab)
      const params = new URLSearchParams(searchParams.toString())
      if (tab === 'profile') {
        params.delete('tab')
      } else {
        params.set('tab', tab)
      }
      const qs = params.toString()
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false })
    },
    [basePath, router, searchParams]
  )

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
              حساب کاربری
            </h1>
            <p className='text-sm text-muted-foreground md:text-base'>
              اطلاعات، نشست‌ها، امنیت و اعلانات حساب خود را مدیریت کنید.
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className='gap-6'
          >
            <TabsList className='grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-sidebar-border bg-sidebar p-1 text-sidebar-foreground sm:grid-cols-4'>
              <TabsTrigger
                value='profile'
                className='gap-1.5 rounded-lg px-2 py-2.5 text-xs text-muted-foreground data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-sidebar-accent sm:text-sm'
              >
                <UserRound className='size-4 shrink-0' />
                <span>پروفایل</span>
              </TabsTrigger>
              <TabsTrigger
                value='sessions'
                className='gap-1.5 rounded-lg px-2 py-2.5 text-xs text-muted-foreground data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-sidebar-accent sm:text-sm'
              >
                <MonitorSmartphone className='size-4 shrink-0' />
                <span>نشست‌ها</span>
              </TabsTrigger>
              <TabsTrigger
                value='security'
                className='gap-1.5 rounded-lg px-2 py-2.5 text-xs text-muted-foreground data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-sidebar-accent sm:text-sm'
              >
                <Shield className='size-4 shrink-0' />
                <span>تنظیمات</span>
              </TabsTrigger>
              <TabsTrigger
                value='notifications'
                className='gap-1.5 rounded-lg px-2 py-2.5 text-xs text-muted-foreground data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-sidebar-accent sm:text-sm'
              >
                <Bell className='size-4 shrink-0' />
                <span className='flex items-center gap-1.5'>
                  اعلانات
                  {unreadCount > 0 ? (
                    <span className='rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums'>
                      {unreadCount > 9
                        ? '۹+'
                        : unreadCount.toLocaleString('fa-IR')}
                    </span>
                  ) : null}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value='profile'
              className='mt-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-200 focus-visible:ring-0'
            >
              <ProfileTab />
            </TabsContent>
            <TabsContent
              value='sessions'
              className='mt-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-200 focus-visible:ring-0'
            >
              <SessionsTab />
            </TabsContent>
            <TabsContent
              value='security'
              className='mt-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-200 focus-visible:ring-0'
            >
              <SecurityTab />
            </TabsContent>
            <TabsContent
              value='notifications'
              className='mt-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-200 focus-visible:ring-0'
            >
              <NotificationsFeedTab />
            </TabsContent>
          </Tabs>
        </div>
      </Main>
    </>
  )
}
