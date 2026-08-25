'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Eye, Search as SearchIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { usePortalHydration } from './hooks/use-portal-hydration'
import { usePortalStore } from './stores/portal-store'
import { PageShell, PortalListSkeleton } from './components/page-shell'
import { ErrorState } from './components/error-state'
import { EmptyState } from './components/empty-state'
import { SummaryCard } from './components/summary-card'
import { PaymentStatusBadge } from './components/status-badges'
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  type ClientPayment,
  type PaymentStatus,
} from './types'
import { formatDate, formatDateTime, formatMoney } from './utils/format'

export function ClientPaymentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentParam = searchParams.get('payment')
  const statusParam = searchParams.get('status')

  const { hydrated } = usePortalHydration()
  const payments = usePortalStore((s) => s.payments)
  const cases = usePortalStore((s) => s.cases)
  const error = usePortalStore((s) => s.error)
  const hydrate = usePortalStore((s) => s.hydrate)
  const retryPayment = usePortalStore((s) => s.retryPayment)
  const getPayment = usePortalStore((s) => s.getPayment)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string>(
    statusParam && PAYMENT_STATUSES.includes(statusParam as PaymentStatus)
      ? statusParam
      : 'all'
  )
  const [selectedId, setSelectedId] = useState<string | null>(paymentParam)

  useEffect(() => {
    if (paymentParam) setSelectedId(paymentParam)
  }, [paymentParam])

  const selected = selectedId ? getPayment(selectedId) : null

  const summary = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + p.amount, 0)
    const completed = payments.filter((p) => p.status === 'completed')
    const pending = payments.filter((p) => p.status === 'pending')
    const failed = payments.filter((p) => p.status === 'failed')
    return {
      total,
      completedAmount: completed.reduce((sum, p) => sum + p.amount, 0),
      completedCount: completed.length,
      pendingCount: pending.length,
      failedCount: failed.length,
    }
  }, [payments])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return payments
      .filter((item) => {
        const matchesStatus = status === 'all' || item.status === status
        const caseTitle = item.caseId
          ? (cases.find((c) => c.id === item.caseId)?.title ?? '')
          : ''
        const matchesQuery =
          !q ||
          item.title.toLowerCase().includes(q) ||
          (item.transactionId?.toLowerCase().includes(q) ?? false) ||
          caseTitle.toLowerCase().includes(q)
        return matchesStatus && matchesQuery
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }, [payments, cases, query, status])

  const getCaseTitle = (caseId: string | null) =>
    caseId
      ? (cases.find((c) => c.id === caseId)?.title ?? '—')
      : 'بدون پرونده'

  const openPayment = (payment: ClientPayment) => {
    setSelectedId(payment.id)
    const params = new URLSearchParams(searchParams.toString())
    params.set('payment', payment.id)
    router.replace(`/payments?${params.toString()}`, { scroll: false })
  }

  const closePayment = () => {
    setSelectedId(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('payment')
    const qs = params.toString()
    router.replace(qs ? `/payments?${qs}` : '/payments', { scroll: false })
  }

  const handleRetry = (paymentId: string) => {
    const result = retryPayment(paymentId)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('پرداخت با موفقیت انجام شد.')
  }

  return (
    <PageShell
      title='پرداخت‌ها'
      description='تاریخچه و وضعیت پرداخت‌های مرتبط با پرونده‌های خود را مدیریت کنید.'
    >
      {!hydrated ? (
        <PortalListSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => hydrate()} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title='هنوز پرداختی ثبت نشده است.'
          description='پس از صدور صورتحساب توسط وکیل، پرداخت‌ها در این بخش نمایش داده می‌شوند.'
        />
      ) : (
        <div className='space-y-4'>
          <section className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
            <SummaryCard
              title='مجموع پرداخت‌ها'
              value={formatMoney(summary.total)}
              icon={CreditCard}
            />
            <SummaryCard
              title='پرداخت‌های موفق'
              value={summary.completedCount}
              icon={CreditCard}
              hint={formatMoney(summary.completedAmount)}
            />
            <SummaryCard
              title='در انتظار پرداخت'
              value={summary.pendingCount}
              icon={CreditCard}
            />
            <SummaryCard
              title='ناموفق'
              value={summary.failedCount}
              icon={CreditCard}
            />
          </section>

          <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
            <div className='relative min-w-0 flex-1 sm:max-w-sm'>
              <SearchIcon className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='جستجو بر اساس عنوان، پرونده یا شناسه'
                className='ps-9'
                aria-label='جستجوی پرداخت'
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='w-full sm:w-48' aria-label='فیلتر وضعیت'>
                <SelectValue placeholder='وضعیت' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>همه وضعیت‌ها</SelectItem>
                {PAYMENT_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {PAYMENT_STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <p className='rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground'>
              نتیجه‌ای با این فیلتر یافت نشد.
            </p>
          ) : (
            <>
              <div className='hidden overflow-x-auto rounded-xl border md:block'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='text-start'>عنوان</TableHead>
                      <TableHead className='text-start'>پرونده</TableHead>
                      <TableHead className='text-start'>مبلغ</TableHead>
                      <TableHead className='text-start'>تاریخ</TableHead>
                      <TableHead className='text-start'>وضعیت</TableHead>
                      <TableHead className='text-start'>شناسه تراکنش</TableHead>
                      <TableHead className='w-24 text-start'>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className='font-medium'>
                          {item.title}
                        </TableCell>
                        <TableCell>
                          {item.caseId ? (
                            <Link
                              href={`/cases/${item.caseId}`}
                              className='hover:underline'
                            >
                              {getCaseTitle(item.caseId)}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className='tabular-nums'>
                          {formatMoney(item.amount)}
                        </TableCell>
                        <TableCell>
                          {formatDate(item.paidAt ?? item.createdAt)}
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={item.status} />
                        </TableCell>
                        <TableCell className='font-mono text-xs'>
                          {item.transactionId ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => openPayment(item)}
                          >
                            <Eye className='size-4' />
                            جزئیات
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ul className='space-y-3 md:hidden'>
                {filtered.map((item) => (
                  <li key={item.id} className='rounded-xl border p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0 space-y-1'>
                        <p className='font-semibold'>{item.title}</p>
                        <p className='text-xs text-muted-foreground'>
                          {getCaseTitle(item.caseId)}
                        </p>
                      </div>
                      <PaymentStatusBadge status={item.status} />
                    </div>
                    <dl className='mt-3 grid grid-cols-2 gap-2 text-xs'>
                      <div>
                        <dt className='text-muted-foreground'>مبلغ</dt>
                        <dd className='mt-0.5 font-medium tabular-nums'>
                          {formatMoney(item.amount)}
                        </dd>
                      </div>
                      <div>
                        <dt className='text-muted-foreground'>تاریخ</dt>
                        <dd className='mt-0.5 font-medium'>
                          {formatDate(item.paidAt ?? item.createdAt)}
                        </dd>
                      </div>
                    </dl>
                    <Button
                      variant='outline'
                      size='sm'
                      className='mt-3 w-full'
                      onClick={() => openPayment(item)}
                    >
                      مشاهده جزئیات
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) closePayment()
        }}
      >
        <DialogContent className='max-w-md sm:max-w-lg'>
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  جزئیات پرداخت و وضعیت تراکنش
                </DialogDescription>
              </DialogHeader>

              <dl className='grid gap-3 text-sm sm:grid-cols-2'>
                <div>
                  <dt className='text-muted-foreground'>مبلغ</dt>
                  <dd className='mt-0.5 font-semibold tabular-nums'>
                    {formatMoney(selected.amount)}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>وضعیت</dt>
                  <dd className='mt-0.5'>
                    <PaymentStatusBadge status={selected.status} />
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>تاریخ</dt>
                  <dd className='mt-0.5 font-medium'>
                    {formatDate(selected.paidAt ?? selected.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>زمان</dt>
                  <dd className='mt-0.5 font-medium'>
                    {formatDateTime(selected.paidAt ?? selected.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>روش پرداخت</dt>
                  <dd className='mt-0.5 font-medium'>
                    {PAYMENT_METHOD_LABELS[selected.method]}
                  </dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>شناسه تراکنش</dt>
                  <dd className='mt-0.5 font-mono text-xs'>
                    {selected.transactionId ?? '—'}
                  </dd>
                </div>
                <div className='sm:col-span-2'>
                  <dt className='text-muted-foreground'>پرونده مرتبط</dt>
                  <dd className='mt-0.5 font-medium'>
                    {selected.caseId ? (
                      <Link
                        href={`/cases/${selected.caseId}`}
                        className='hover:underline'
                      >
                        {getCaseTitle(selected.caseId)}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div className='sm:col-span-2'>
                  <dt className='text-muted-foreground'>توضیحات</dt>
                  <dd className='mt-0.5 leading-6 text-muted-foreground'>
                    {selected.description || 'توضیحی ثبت نشده است.'}
                  </dd>
                </div>
              </dl>

              <DialogFooter className='gap-2 sm:justify-start'>
                {(selected.status === 'failed' ||
                  selected.status === 'pending') && (
                  <Button onClick={() => handleRetry(selected.id)}>
                    {selected.status === 'failed'
                      ? 'تلاش مجدد پرداخت'
                      : 'پرداخت اکنون'}
                  </Button>
                )}
                <Button variant='outline' onClick={closePayment}>
                  بستن
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
