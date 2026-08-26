'use client'

import Link from 'next/link'
import {
  ArrowRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LEGAL_AREA_LABELS, type Case, type Client } from '../types'
import { formatDate } from '../utils/format'
import { CaseStatusBadge } from './case-status-badge'
import { useCasesDialogs } from './cases-provider'

type CaseDetailHeaderProps = {
  caseItem: Case
  client: Client | null
}

export function CaseDetailHeader({ caseItem, client }: CaseDetailHeaderProps) {
  const { setOpen, setCurrentRow } = useCasesDialogs()

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
        <Button variant='ghost' size='sm' className='h-8 px-2' asChild>
          <Link href='/admin/cases'>
            <ArrowRight className='size-4' />
            پرونده‌ها
          </Link>
        </Button>
        <span>/</span>
        <span className='truncate text-foreground'>{caseItem.caseNumber}</span>
      </div>

      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0 space-y-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <h1 className='font-display text-xl font-bold tracking-tight sm:text-2xl'>
              {caseItem.title}
            </h1>
            <CaseStatusBadge status={caseItem.status} />
          </div>

          <dl className='grid grid-cols-2 gap-3 text-sm sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2'>
            <div>
              <dt className='text-muted-foreground'>شماره پرونده</dt>
              <dd className='mt-0.5 font-medium tabular-nums'>
                {caseItem.caseNumber}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>موکل</dt>
              <dd className='mt-0.5 font-medium'>{client?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>حوزه</dt>
              <dd className='mt-0.5 font-medium'>
                {LEGAL_AREA_LABELS[caseItem.legalArea]}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>آخرین بروزرسانی</dt>
              <dd className='mt-0.5 font-medium'>
                {formatDate(caseItem.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>

        <div className='flex w-full shrink-0 items-center gap-2 sm:w-auto'>
          <Button
            variant='outline'
            className='flex-1 sm:flex-none'
            onClick={() => {
              setCurrentRow(caseItem)
              setOpen('update')
            }}
          >
            <Pencil className='size-4' />
            ویرایش
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon' aria-label='عملیات بیشتر'>
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-44'>
              <DropdownMenuItem
                onClick={() => {
                  setCurrentRow(caseItem)
                  setOpen('update')
                }}
              >
                <Pencil className='size-4' />
                ویرایش پرونده
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='text-destructive focus:text-destructive'
                onClick={() => {
                  setCurrentRow(caseItem)
                  setOpen('delete')
                }}
              >
                <Trash2 className='size-4' />
                حذف پرونده
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
