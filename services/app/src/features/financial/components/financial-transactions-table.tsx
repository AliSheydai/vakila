'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDownUp, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/features/cases/types'
import { cn } from '@/lib/utils'
import type { FinancialTransaction } from '../types'
import {
  FINANCIAL_KIND_LABELS,
  FINANCIAL_PAYMENT_STATUS_LABELS,
  formatFinancialDate,
  formatFinancialMoney,
  formatFinancialNumber,
} from '../utils/format'
import { FinancialFilteredEmptyState } from './financial-filtered-empty-state'
import { FinancialRangeEmptyState } from './financial-filtered-empty-state'
import { FinancialTransactionDetails } from './financial-transaction-details'

type SortKey = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'

type FinancialTransactionsTableProps = {
  transactions: FinancialTransaction[]
  rangeTransactionCount: number
  filtersActive: boolean
  onClearFilters: () => void
}

export function FinancialTransactionsTable({
  transactions,
  rangeTransactionCount,
  filtersActive,
  onClearFilters,
}: FinancialTransactionsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date_desc')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    const rows = [...transactions]
    rows.sort((a, b) => {
      switch (sortKey) {
        case 'date_asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'amount_desc':
          return b.amount - a.amount
        case 'amount_asc':
          return a.amount - b.amount
        case 'date_desc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })
    return rows
  }, [sortKey, transactions])

  const selected =
    sorted.find((item) => item.id === selectedId) ??
    transactions.find((item) => item.id === selectedId) ??
    null

  if (rangeTransactionCount === 0) {
    return <FinancialRangeEmptyState />
  }

  if (transactions.length === 0 && filtersActive) {
    return <FinancialFilteredEmptyState onClearFilters={onClearFilters} />
  }

  if (transactions.length === 0) {
    return <FinancialRangeEmptyState />
  }

  return (
    <section aria-label='جدول تراکنش‌های مالی' className='space-y-3'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div className='min-w-0'>
          <h3 className='text-sm font-semibold tracking-tight sm:text-base'>
            تراکنش‌ها
          </h3>
          <p className='text-xs text-muted-foreground'>
            {formatFinancialNumber(sorted.length)} ردیف · دریافت‌ها و هزینه‌های
            بازه انتخاب‌شده
          </p>
        </div>
        <div className='flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-52'>
          <label
            className='text-xs text-muted-foreground'
            htmlFor='financial-sort'
          >
            مرتب‌سازی
          </label>
          <div className='flex items-center gap-2'>
            <ArrowDownUp
              className='hidden size-4 shrink-0 text-muted-foreground sm:block'
              aria-hidden
            />
            <Select
              value={sortKey}
              onValueChange={(value) => setSortKey(value as SortKey)}
            >
              <SelectTrigger
                id='financial-sort'
                className='w-full'
                aria-label='مرتب‌سازی تراکنش‌ها'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='date_desc'>جدیدترین تاریخ</SelectItem>
                <SelectItem value='date_asc'>قدیمی‌ترین تاریخ</SelectItem>
                <SelectItem value='amount_desc'>بیشترین مبلغ</SelectItem>
                <SelectItem value='amount_asc'>کمترین مبلغ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ul className='space-y-3 md:hidden'>
        {sorted.map((row) => (
          <li key={row.id} className='rounded-xl border bg-background p-4'>
            <div className='flex items-start justify-between gap-3'>
              <button
                type='button'
                className='min-w-0 flex-1 space-y-1 rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-ring'
                onClick={() => setSelectedId(row.id)}
                aria-label={`جزئیات ${FINANCIAL_KIND_LABELS[row.kind]} ${formatFinancialMoney(row.amount)}`}
              >
                <div className='flex flex-wrap items-center gap-1.5'>
                  <KindBadge kind={row.kind} />
                  {row.status ? (
                    <Badge variant='outline' className='text-[11px]'>
                      {FINANCIAL_PAYMENT_STATUS_LABELS[row.status]}
                    </Badge>
                  ) : null}
                </div>
                <p className='text-base font-semibold tracking-tight tabular-nums'>
                  {formatFinancialMoney(row.amount)}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {formatFinancialDate(row.date)}
                </p>
              </button>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-8 shrink-0'
                aria-label={`مشاهده جزئیات تراکنش ${row.caseTitle}`}
                onClick={() => setSelectedId(row.id)}
              >
                <Eye className='size-4' />
              </Button>
            </div>

            <dl className='mt-3 grid grid-cols-2 gap-2 text-xs'>
              <div className='min-w-0'>
                <dt className='text-muted-foreground'>پرونده</dt>
                <dd className='mt-0.5 truncate'>
                  <Link
                    href={`/admin/cases/${row.caseId}`}
                    className='font-medium underline-offset-4 hover:underline'
                  >
                    {row.caseTitle}
                  </Link>
                </dd>
              </div>
              <div className='min-w-0'>
                <dt className='text-muted-foreground'>موکل</dt>
                <dd className='mt-0.5 truncate'>
                  {row.clientId ? (
                    <Link
                      href={`/admin/clients/${row.clientId}`}
                      className='font-medium underline-offset-4 hover:underline'
                    >
                      {row.clientName ?? '—'}
                    </Link>
                  ) : (
                    (row.clientName ?? '—')
                  )}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>مالیات</dt>
                <dd className='mt-0.5 tabular-nums'>
                  {row.kind === 'payment' && row.status === 'completed'
                    ? formatFinancialMoney(row.taxAmount)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>خالص</dt>
                <dd className='mt-0.5 tabular-nums'>
                  {formatFinancialMoney(row.netAmount)}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className='hidden overflow-x-auto rounded-xl border md:block'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='text-start'>تاریخ</TableHead>
              <TableHead className='text-start'>نوع</TableHead>
              <TableHead className='text-start'>مبلغ</TableHead>
              <TableHead className='text-start'>مالیات</TableHead>
              <TableHead className='text-start'>خالص</TableHead>
              <TableHead className='text-start whitespace-nowrap'>
                وضعیت / روش یا دسته
              </TableHead>
              <TableHead className='text-start'>پرونده</TableHead>
              <TableHead className='text-start'>موکل</TableHead>
              <TableHead className='text-start'>توضیحات</TableHead>
              <TableHead className='w-12 text-start'>
                <span className='sr-only'>جزئیات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.id}>
                <TableCell className='whitespace-nowrap tabular-nums text-muted-foreground'>
                  {formatFinancialDate(row.date)}
                </TableCell>
                <TableCell>
                  <KindBadge kind={row.kind} />
                </TableCell>
                <TableCell className='whitespace-nowrap font-medium tabular-nums'>
                  {formatFinancialMoney(row.amount)}
                </TableCell>
                <TableCell className='whitespace-nowrap tabular-nums'>
                  {row.kind === 'payment' && row.status === 'completed'
                    ? formatFinancialMoney(row.taxAmount)
                    : '—'}
                </TableCell>
                <TableCell className='whitespace-nowrap tabular-nums'>
                  {formatFinancialMoney(row.netAmount)}
                </TableCell>
                <TableCell className='max-w-[10rem]'>
                  <MetaCell row={row} />
                </TableCell>
                <TableCell className='max-w-[12rem]'>
                  <Link
                    href={`/admin/cases/${row.caseId}`}
                    className='line-clamp-2 font-medium underline-offset-4 hover:underline'
                  >
                    {row.caseTitle}
                  </Link>
                  <p className='text-xs tabular-nums text-muted-foreground'>
                    {row.caseNumber}
                  </p>
                </TableCell>
                <TableCell className='max-w-[9rem]'>
                  {row.clientId ? (
                    <Link
                      href={`/admin/clients/${row.clientId}`}
                      className='line-clamp-2 underline-offset-4 hover:underline'
                    >
                      {row.clientName ?? '—'}
                    </Link>
                  ) : (
                    <span className='text-muted-foreground'>
                      {row.clientName ?? '—'}
                    </span>
                  )}
                </TableCell>
                <TableCell className='max-w-[12rem]'>
                  <span className='line-clamp-2 text-muted-foreground'>
                    {row.description?.trim() || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='size-8'
                    aria-label={`مشاهده جزئیات تراکنش ${row.caseTitle}`}
                    onClick={() => setSelectedId(row.id)}
                  >
                    <Eye className='size-4' />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <FinancialTransactionDetails
        transaction={selected}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      />
    </section>
  )
}

function KindBadge({ kind }: { kind: FinancialTransaction['kind'] }) {
  return (
    <Badge
      variant='secondary'
      className={cn(
        kind === 'payment' &&
          'bg-emerald-100/70 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100',
        kind === 'expense' &&
          'bg-amber-100/70 text-amber-950 dark:bg-amber-900/30 dark:text-amber-100'
      )}
    >
      {FINANCIAL_KIND_LABELS[kind]}
    </Badge>
  )
}

function MetaCell({ row }: { row: FinancialTransaction }) {
  if (row.kind === 'payment') {
    const status = row.status
      ? FINANCIAL_PAYMENT_STATUS_LABELS[row.status]
      : null
    const method = row.method ? PAYMENT_METHOD_LABELS[row.method] : null
    return (
      <div className='space-y-0.5 text-xs'>
        {status ? <p>{status}</p> : null}
        {method ? <p className='text-muted-foreground'>{method}</p> : null}
      </div>
    )
  }

  return (
    <p className='text-xs'>
      {row.category ? EXPENSE_CATEGORY_LABELS[row.category] : '—'}
    </p>
  )
}
