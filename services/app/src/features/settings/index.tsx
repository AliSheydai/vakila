'use client'

import { UserRound, MonitorSmartphone, Shield } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileTab } from './components/profile-tab'
import { SessionsTab } from './components/sessions-tab'
import { SecurityTab } from './components/security-tab'

export function Settings() {
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
              اطلاعات، نشست‌ها و امنیت حساب خود را مدیریت کنید.
            </p>
          </div>

          <Tabs defaultValue='profile' className='gap-6'>
            <TabsList className='grid h-auto w-full grid-cols-3 gap-1 rounded-xl border border-sidebar-border bg-sidebar p-1 text-sidebar-foreground'>
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
          </Tabs>
        </div>
      </Main>
    </>
  )
}
