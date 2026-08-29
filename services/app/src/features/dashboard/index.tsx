'use client'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { TelegramBotEntry } from '@/components/messenger/telegram-bot-entry'

export function Dashboard() {
  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-3'>
          <TelegramBotEntry variant='compact' />
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
            <TelegramBotEntry />
          </div>
        </div>
      </Main>
    </>
  )
}
