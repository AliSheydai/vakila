'use client'

import Link from 'next/link'
import {
  ArrowRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Client } from '@/features/cases/types'
import { formatDate } from '@/features/cases/utils/format'
import { getClientInitials } from './clients-columns'
import { useClientsDialogs } from './clients-provider'

type ClientDetailHeaderProps = {
  client: Client
  caseCount: number
  hasActiveCase: boolean
}

export function ClientDetailHeader({
  client,
  caseCount,
  hasActiveCase,
}: ClientDetailHeaderProps) {
  const { setOpen, setCurrentRow } = useClientsDialogs()

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
        <Button variant='ghost' size='sm' className='h-8 px-2' asChild>
          <Link href='/admin/clients'>
            <ArrowRight className='size-4' />
            موکل‌ها
          </Link>
        </Button>
        <span>/</span>
        <span className='truncate text-foreground'>{client.name}</span>
      </div>

      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex min-w-0 items-start gap-4'>
          <Avatar className='size-14 shrink-0 sm:size-16'>
            <AvatarFallback className='text-base sm:text-lg'>
              {getClientInitials(client.name)}
            </AvatarFallback>
          </Avatar>

          <div className='min-w-0 space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <h1 className='text-xl font-bold tracking-tight sm:text-2xl'>
                {client.name}
              </h1>
              {hasActiveCase ? (
                <Badge variant='secondary'>پرونده فعال</Badge>
              ) : caseCount > 0 ? (
                <Badge variant='outline'>بدون پرونده فعال</Badge>
              ) : (
                <Badge variant='outline'>بدون پرونده</Badge>
              )}
            </div>

            <dl className='grid grid-cols-2 gap-3 text-sm sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2'>
              <div>
                <dt className='text-muted-foreground'>موبایل</dt>
                <dd className='mt-0.5 font-medium tabular-nums' dir='ltr'>
                  {client.phone}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>ایمیل</dt>
                <dd className='mt-0.5 truncate font-medium'>
                  {client.email || '—'}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>پرونده‌ها</dt>
                <dd className='mt-0.5 font-medium tabular-nums'>
                  {caseCount.toLocaleString('fa-IR')}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>آخرین بروزرسانی</dt>
                <dd className='mt-0.5 font-medium'>
                  {formatDate(client.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className='flex w-full shrink-0 items-center gap-2 sm:w-auto'>
          <Button
            variant='outline'
            className='min-w-0 flex-1 sm:flex-none'
            onClick={() => {
              setCurrentRow(client)
              setOpen('update')
            }}
          >
            <Pencil className='size-4' />
            ویرایش
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                className='shrink-0'
                aria-label={`عملیات بیشتر برای ${client.name}`}
              >
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-44'>
              <DropdownMenuItem
                onClick={() => {
                  setCurrentRow(client)
                  setOpen('update')
                }}
              >
                <Pencil className='size-4' />
                ویرایش موکل
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='text-destructive focus:text-destructive'
                onClick={() => {
                  setCurrentRow(client)
                  setOpen('delete')
                }}
              >
                <Trash2 className='size-4' />
                حذف موکل
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
