'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Case } from '@/features/cases/types'
import { listSuccessfulPaymentsInRange } from '../services/statistics-service'
import type { StatisticsDateRange, StatisticsTimePoint } from '../types'
import {
  formatStatDate,
  formatStatMoney,
  formatStatNumber,
} from '../utils/format'
import { StatsChartEmpty } from './stats-chart-card'

const PAGE_SIZE = 10
const PAYMENTS_LIMIT = 8

type StatsDetailsSectionProps = {
  timeline: StatisticsTimePoint[]
  range: StatisticsDateRange
  cases: Case[]
}

export function StatsDetailsSection({
  timeline,
  range,
  cases,
}: StatsDetailsSectionProps) {
  const [page, setPage] = useState(0)

  const rows = useMemo(
    () =>
      [...timeline]
        .reverse()
        .filter(
          (item) =>
            item.events > 0 ||
            item.createdCases > 0 ||
            item.newClients > 0 ||
            item.revenue > 0
        ),
    [timeline]
  )

  useEffect(() => {
    setPage(0)
  }, [range.from, range.to])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const payments = useMemo(
    () => listSuccessfulPaymentsInRange(cases, range).slice(0, PAYMENTS_LIMIT),
    [cases, range]
  )

  return (
    <div className='space-y-4 sm:space-y-6'>
      <section className='rounded-xl border bg-background/60 p-4 sm:p-5'>
        <div className='mb-4 space-y-1'>
          <h3 className='text-sm font-semibold tracking-tight sm:text-base'>
            عملکرد روزانه
          </h3>
          <p className='text-xs text-muted-foreground sm:text-sm'>
            جلسات، پرونده‌های جدید و درآمد در هر بازه زمانی.
          </p>
        </div>

        {rows.length === 0 ? (
          <StatsChartEmpty />
        ) : (
          <>
            <div className='hidden overflow-x-auto rounded-lg border md:block'>
              <Table>
                <caption className='sr-only'>
                  جدول عملکرد بازه انتخاب‌شده شامل رویداد، پرونده جدید، موکل جدید و درآمد
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-start'>تاریخ</TableHead>
                    <TableHead className='text-start'>جلسات / رویداد</TableHead>
                    <TableHead className='text-start'>پرونده جدید</TableHead>
                    <TableHead className='text-start'>موکل جدید</TableHead>
                    <TableHead className='text-start'>درآمد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((row) => (
                    <TableRow key={`${row.from}-${row.to}`}>
                      <TableCell className='font-medium'>{row.label}</TableCell>
                      <TableCell className='tabular-nums'>
                        {formatStatNumber(row.events)}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {formatStatNumber(row.createdCases)}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {formatStatNumber(row.newClients)}
                      </TableCell>
                      <TableCell className='tabular-nums'>
                        {formatStatMoney(row.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className='space-y-3 md:hidden'>
              {visible.map((row) => (
                <li key={`${row.from}-${row.to}`} className='rounded-lg border p-3'>
                  <p className='font-medium'>{row.label}</p>
                  <dl className='mt-2 grid grid-cols-2 gap-2 text-xs'>
                    <div>
                      <dt className='text-muted-foreground'>رویداد</dt>
                      <dd className='tabular-nums'>{formatStatNumber(row.events)}</dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>پرونده جدید</dt>
                      <dd className='tabular-nums'>
                        {formatStatNumber(row.createdCases)}
                      </dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>موکل جدید</dt>
                      <dd className='tabular-nums'>
                        {formatStatNumber(row.newClients)}
                      </dd>
                    </div>
                    <div>
                      <dt className='text-muted-foreground'>درآمد</dt>
                      <dd className='tabular-nums'>{formatStatMoney(row.revenue)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            {pageCount > 1 ? (
              <div className='mt-3 flex items-center justify-between gap-3'>
                <p className='text-xs text-muted-foreground' aria-live='polite'>
                  صفحه {formatStatNumber(safePage + 1)} از {formatStatNumber(pageCount)}
                </p>
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={safePage === 0}
                    aria-label='صفحه قبلی جدول عملکرد'
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  >
                    قبلی
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={safePage >= pageCount - 1}
                    aria-label='صفحه بعدی جدول عملکرد'
                    onClick={() =>
                      setPage((current) => Math.min(pageCount - 1, current + 1))
                    }
                  >
                    بعدی
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className='rounded-xl border bg-background/60 p-4 sm:p-5'>
        <div className='mb-4 space-y-1'>
          <h3 className='text-sm font-semibold tracking-tight sm:text-base'>
            پرداخت‌های موفق
          </h3>
          <p className='text-xs text-muted-foreground sm:text-sm'>
            برای جزئیات مالی هر پرداخت، پرونده مرتبط را باز کنید. صفحه مستقل تراکنش
            ادمین هنوز وجود ندارد.
          </p>
        </div>

        {payments.length === 0 ? (
          <StatsChartEmpty />
        ) : (
          <ul className='divide-y rounded-lg border'>
            {payments.map((payment) => (
              <li
                key={payment.id}
                className='flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between'
              >
                <div className='min-w-0 space-y-0.5'>
                  <p className='truncate font-medium'>{payment.caseTitle}</p>
                  <p className='text-xs text-muted-foreground'>
                    {formatStatDate(new Date(payment.date))} ·{' '}
                    {formatStatMoney(payment.amount)}
                  </p>
                </div>
                <Button asChild variant='outline' size='sm' className='w-full sm:w-auto'>
                  <Link href={`/admin/cases/${payment.caseId}`}>مشاهده پرونده</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
