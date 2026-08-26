'use client'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export function Dashboard() {
  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-3'>
          <Search />
          <ThemeSwitch />
        </div>
      </Header>

      <Main fixed className='flex flex-1 items-center justify-center'>
        <h1 className='font-display text-2xl font-medium tracking-tight text-muted-foreground'>
          خوش آمدید
        </h1>
      </Main>
    </>
  )
}
