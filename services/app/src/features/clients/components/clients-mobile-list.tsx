'use client'

import Link from 'next/link'
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { formatDate } from '@/features/cases/utils/format'
import {
  getClientInitials,
  type ClientTableRow,
} from './clients-columns'
import { useClientsDialogs } from './clients-provider'

type ClientsMobileListProps = {
  rows: ClientTableRow[]
  onClearFilters?: () => void
  hasActiveFilters?: boolean
}

export function ClientsMobileList({
  rows,
  onClearFilters,
  hasActiveFilters,
}: ClientsMobileListProps) {
  const { setOpen, setCurrentRow } = useClientsDialogs()

  if (rows.length === 0) {
    return (
      <div className='rounded-lg border border-dashed px-4 py-12 text-center md:hidden'>
        <p className='text-sm text-muted-foreground'>
          {hasActiveFilters
            ? 'موکلی با این مشخصات پیدا نشد.'
            : 'نتیجه‌ای یافت نشد.'}
        </p>
        {hasActiveFilters && onClearFilters && (
          <Button
            variant='ghost'
            size='sm'
            className='mt-3'
            onClick={onClearFilters}
          >
            پاک کردن جستجو و فیلتر
          </Button>
        )}
      </div>
    )
  }

  return (
    <ul className='space-y-3 md:hidden'>
      {rows.map((client) => (
        <li key={client.id} className='rounded-xl border bg-background p-4'>
          <div className='flex items-start justify-between gap-3'>
            <Link
              href={`/admin/clients/${client.id}`}
              className='flex min-w-0 items-center gap-3 hover:underline'
            >
              <Avatar className='size-10 shrink-0'>
                <AvatarFallback className='text-sm'>
                  {getClientInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0 space-y-0.5'>
                <p className='truncate text-base font-semibold tracking-tight'>
                  {client.name}
                </p>
                <p className='text-xs tabular-nums text-muted-foreground' dir='ltr'>
                  {client.phone}
                </p>
              </div>
            </Link>
            <div className='flex shrink-0 items-center gap-2'>
              {client.hasActiveCase ? (
                <Badge variant='secondary' className='text-[10px]'>
                  فعال
                </Badge>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-8'
                    aria-label={`عملیات موکل ${client.name}`}
                  >
                    <MoreHorizontal className='size-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-44'>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/clients/${client.id}`}>
                      <Eye className='size-4' />
                      مشاهده
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setCurrentRow(client)
                      setOpen('update')
                    }}
                  >
                    <Pencil className='size-4' />
                    ویرایش
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
                    حذف
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

            <dl className='mt-3 grid grid-cols-2 gap-2 text-xs'>
            <div>
              <dt className='text-muted-foreground'>ایمیل</dt>
              <dd
                className='mt-0.5 truncate font-medium'
                dir='ltr'
                title={client.email || undefined}
              >
                {client.email || '—'}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>آخرین تغییر</dt>
              <dd className='mt-0.5 font-medium'>
                {formatDate(client.updatedAt)}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>پرونده‌ها</dt>
              <dd className='mt-0.5 font-medium tabular-nums'>
                {client.caseCount.toLocaleString('fa-IR')}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>ضمائم</dt>
              <dd className='mt-0.5 font-medium tabular-nums'>
                {client.attachmentCount.toLocaleString('fa-IR')}
              </dd>
            </div>
          </dl>

          <Button asChild variant='outline' size='sm' className='mt-4 w-full'>
            <Link href={`/admin/clients/${client.id}`}>مشاهده موکل</Link>
          </Button>
        </li>
      ))}
    </ul>
  )
}
