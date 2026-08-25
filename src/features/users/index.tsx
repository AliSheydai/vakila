'use client'

import { useMemo, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { users } from './data/users'
import type { NavigateFn } from '@/hooks/use-table-url-state'

export function Users() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const search = useMemo(() => {
    const obj: Record<string, unknown> = {}
    searchParams.forEach((val, key) => {
      if (val.includes(',')) {
        obj[key] = val.split(',')
      } else if (!isNaN(Number(val)) && val.trim() !== '') {
        obj[key] = Number(val)
      } else {
        obj[key] = val
      }
    })
    return obj
  }, [searchParams])

  const navigate: NavigateFn = useCallback(
    ({ search: newSearch, replace }) => {
      const nextSearchObj =
        typeof newSearch === 'function'
          ? newSearch(search)
          : newSearch === true
            ? search
            : newSearch

      const params = new URLSearchParams()
      Object.entries(nextSearchObj || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          if (Array.isArray(v)) {
            if (v.length > 0) params.set(k, v.join(','))
          } else {
            params.set(k, String(v))
          }
        }
      })

      const queryStr = params.toString()
      const url = queryStr ? `${pathname}?${queryStr}` : pathname
      if (replace) {
        router.replace(url)
      } else {
        router.push(url)
      }
    },
    [router, pathname, search]
  )

  return (
    <UsersProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
            <p className='text-muted-foreground'>
              Manage your users and their roles here.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <UsersTable data={users} search={search} navigate={navigate} />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
