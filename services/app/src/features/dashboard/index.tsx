'use client'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ChatbotEntries } from '@/components/messenger/chatbot-entries'

export function Dashboard() {
  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-3'>
          <ChatbotEntries variant='compact' />
          <Search />
          <ThemeSwitch />
        </div>
      </Header>

      <Main fixed className='flex flex-1 flex-col gap-6 p-4 sm:p-6'>
        <div className='flex flex-1 flex-col items-center justify-center gap-8'>
          <h1 className='font-display text-2xl font-medium tracking-tight text-muted-foreground'>
            خوش آمدید
          </h1>
          <div className='w-full max-w-2xl'>
            <ChatbotEntries />
          </div>
        </div>
      </Main>
    </>
  )
}
