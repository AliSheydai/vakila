'use client'

import Link from 'next/link'
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LEGAL_AREA_LABELS } from '../types'
import { getCaseFinancialSummary } from '../utils/finance'
import { formatDate, formatMoneyCompact } from '../utils/format'
import { CaseStatusBadge } from './case-status-badge'
import { useCasesDialogs } from './cases-provider'
import type { CaseTableRow } from './cases-columns'

type CasesMobileListProps = {
  rows: CaseTableRow[]
}

export function CasesMobileList({ rows }: CasesMobileListProps) {
  const { setOpen, setCurrentRow } = useCasesDialogs()

  if (rows.length === 0) {
    return (
      <div className='rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground'>
        نتیجه‌ای با این فیلتر یافت نشد.
      </div>
    )
  }

  return (
    <ul className='space-y-3 md:hidden'>
      {rows.map((item) => {
        const finance = getCaseFinancialSummary(item)
        return (
          <li key={item.id} className='rounded-xl border bg-background p-4'>
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0 space-y-1'>
                <Link
                  href={`/admin/cases/${item.id}`}
                  className='line-clamp-2 text-base font-semibold tracking-tight hover:underline'
                >
                  {item.title}
                </Link>
                <p className='text-xs tabular-nums text-muted-foreground'>
                  {item.caseNumber} · {LEGAL_AREA_LABELS[item.legalArea]}
                </p>
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                <CaseStatusBadge status={item.status} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-8'
                      aria-label='عملیات پرونده'
                    >
                      <MoreHorizontal className='size-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-44'>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/cases/${item.id}`}>
                        <Eye className='size-4' />
                        مشاهده
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setCurrentRow(item)
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
                        setCurrentRow(item)
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
                <dt className='text-muted-foreground'>موکل</dt>
                <dd className='mt-0.5 truncate font-medium'>{item.clientName}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>آخرین تغییر</dt>
                <dd className='mt-0.5 font-medium'>{formatDate(item.updatedAt)}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>حق‌الزحمه</dt>
                <dd className='mt-0.5 font-medium tabular-nums'>
                  {finance.totalFee > 0
                    ? formatMoneyCompact(finance.totalFee)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>پرداخت‌شده</dt>
                <dd className='mt-0.5 font-medium tabular-nums'>
                  {finance.totalPaid > 0
                    ? formatMoneyCompact(finance.totalPaid)
                    : '—'}
                </dd>
              </div>
            </dl>

            <Button asChild variant='outline' size='sm' className='mt-4 w-full'>
              <Link href={`/admin/cases/${item.id}`}>مشاهده پرونده</Link>
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
