'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/features/cases/types'
import type { FinancialTransaction } from '../types'
import {
  FINANCIAL_KIND_LABELS,
  FINANCIAL_PAYMENT_STATUS_LABELS,
  formatFinancialDate,
  formatFinancialMoney,
} from '../utils/format'

type FinancialTransactionDetailsProps = {
  transaction: FinancialTransaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FinancialTransactionDetails({
  transaction,
  open,
  onOpenChange,
}: FinancialTransactionDetailsProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex h-full w-full flex-col gap-0 p-0 sm:max-w-md'>
        <SheetHeader className='border-b px-4 py-4 text-start'>
          <SheetTitle>جزئیات تراکنش</SheetTitle>
          <SheetDescription>
            {transaction
              ? `${FINANCIAL_KIND_LABELS[transaction.kind]} · ${formatFinancialDate(transaction.date)}`
              : 'مشاهده جزئیات ردیف مالی'}
          </SheetDescription>
        </SheetHeader>

        {transaction ? (
          <div className='flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='secondary'>
                {FINANCIAL_KIND_LABELS[transaction.kind]}
              </Badge>
              {transaction.status ? (
                <Badge variant='outline'>
                  {FINANCIAL_PAYMENT_STATUS_LABELS[transaction.status]}
                </Badge>
              ) : null}
              {transaction.category ? (
                <Badge variant='outline'>
                  {EXPENSE_CATEGORY_LABELS[transaction.category]}
                </Badge>
              ) : null}
            </div>

            <dl className='grid gap-4 text-sm'>
              <DetailRow
                label='مبلغ'
                value={formatFinancialMoney(transaction.amount)}
              />
              <DetailRow
                label='مالیات محاسبه‌شده'
                value={
                  transaction.kind === 'payment' &&
                  transaction.status === 'completed'
                    ? formatFinancialMoney(transaction.taxAmount)
                    : '—'
                }
              />
              <DetailRow
                label='خالص'
                value={formatFinancialMoney(transaction.netAmount)}
              />
              <DetailRow
                label='تاریخ'
                value={formatFinancialDate(transaction.date)}
              />
              {transaction.method ? (
                <DetailRow
                  label='روش پرداخت'
                  value={PAYMENT_METHOD_LABELS[transaction.method]}
                />
              ) : null}
              <DetailRow
                label='توضیحات'
                value={transaction.description?.trim() || '—'}
              />
              <DetailRow
                label='پرونده'
                value={
                  <Link
                    href={`/admin/cases/${transaction.caseId}`}
                    className='font-medium text-foreground underline-offset-4 hover:underline'
                  >
                    {transaction.caseTitle}
                    <span className='ms-1 text-xs text-muted-foreground tabular-nums'>
                      ({transaction.caseNumber})
                    </span>
                  </Link>
                }
              />
              <DetailRow
                label='موکل'
                value={
                  transaction.clientId ? (
                    <Link
                      href={`/admin/clients/${transaction.clientId}`}
                      className='font-medium text-foreground underline-offset-4 hover:underline'
                    >
                      {transaction.clientName ?? 'موکل'}
                    </Link>
                  ) : (
                    (transaction.clientName ?? '—')
                  )
                }
              />
            </dl>

            <div className='mt-auto flex flex-col gap-2 border-t pt-4'>
              <Button asChild>
                <Link href={`/admin/cases/${transaction.caseId}`}>
                  مشاهده پرونده
                </Link>
              </Button>
              {transaction.clientId ? (
                <Button asChild variant='outline'>
                  <Link href={`/admin/clients/${transaction.clientId}`}>
                    مشاهده موکل
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className='grid gap-1'>
      <dt className='text-xs text-muted-foreground'>{label}</dt>
      <dd className='tabular-nums leading-6'>{value}</dd>
    </div>
  )
}
