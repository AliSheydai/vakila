'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Download,
  FileText,
  Mail,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePortalHydration } from './hooks/use-portal-hydration'
import { usePortalStore } from './stores/portal-store'
import {
  PageShell,
  PortalDetailSkeleton,
} from './components/page-shell'
import { ErrorState } from './components/error-state'
import {
  CaseStatusBadge,
  DocumentStatusBadge,
  PaymentStatusBadge,
  SessionStatusBadge,
} from './components/status-badges'
import {
  LEGAL_AREA_LABELS,
  SESSION_TYPE_LABELS,
  type TimelineEventType,
} from './types'
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  formatMimeTypeLabel,
  formatMoney,
  formatTime,
} from './utils/format'

const TIMELINE_LABELS: Record<TimelineEventType, string> = {
  created: 'ایجاد',
  review: 'بررسی',
  document: 'مدرک',
  session: 'جلسه',
  status: 'وضعیت',
  payment: 'پرداخت',
  note: 'یادداشت',
}

type ClientCaseDetailPageProps = {
  caseId: string
}

export function ClientCaseDetailPage({ caseId }: ClientCaseDetailPageProps) {
  const { hydrated } = usePortalHydration()
  const caseItem = usePortalStore((s) => s.getCase(caseId))
  const lawyer = usePortalStore((s) =>
    caseItem ? s.getLawyer(caseItem.lawyerId) : null
  )
  const sessions = usePortalStore((s) =>
    s.sessions.filter((item) => item.caseId === caseId)
  )
  const payments = usePortalStore((s) =>
    s.payments.filter((item) => item.caseId === caseId)
  )
  const error = usePortalStore((s) => s.error)
  const hydrate = usePortalStore((s) => s.hydrate)

  if (!hydrated) {
    return (
      <PageShell>
        <PortalDetailSkeleton />
      </PageShell>
    )
  }

  if (error) {
    return (
      <PageShell>
        <ErrorState message={error} onRetry={() => hydrate()} />
      </PageShell>
    )
  }

  if (!caseItem) {
    return (
      <PageShell>
        <div className='space-y-4'>
          <Button variant='ghost' size='sm' className='h-8 px-2' asChild>
            <Link href='/cases'>
              <ArrowRight className='size-4' />
              پرونده‌ها
            </Link>
          </Button>
          <ErrorState message='پرونده مورد نظر یافت نشد.' />
        </div>
      </PageShell>
    )
  }

  const timeline = [...caseItem.timeline].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )

  return (
    <PageShell>
      <div className='space-y-6'>
        <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
          <Button variant='ghost' size='sm' className='h-8 px-2' asChild>
            <Link href='/cases'>
              <ArrowRight className='size-4' />
              پرونده‌ها
            </Link>
          </Button>
          <span>/</span>
          <span className='truncate text-foreground'>{caseItem.caseNumber}</span>
        </div>

        <div className='space-y-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <h1 className='font-display text-xl font-bold tracking-tight sm:text-2xl'>
              {caseItem.title}
            </h1>
            <CaseStatusBadge status={caseItem.status} />
          </div>
          <dl className='grid grid-cols-2 gap-3 text-sm sm:flex sm:flex-wrap sm:gap-x-6'>
            <div>
              <dt className='text-muted-foreground'>شماره پرونده</dt>
              <dd className='mt-0.5 font-medium tabular-nums'>
                {caseItem.caseNumber}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>حوزه</dt>
              <dd className='mt-0.5 font-medium'>
                {LEGAL_AREA_LABELS[caseItem.legalArea]}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>وکیل مسئول</dt>
              <dd className='mt-0.5 font-medium'>{lawyer?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>تاریخ ایجاد</dt>
              <dd className='mt-0.5 font-medium'>
                {formatDate(caseItem.createdAt)}
              </dd>
            </div>
          </dl>
        </div>

        <Tabs defaultValue='overview' className='gap-4'>
          <TabsList className='flex h-auto w-full flex-wrap justify-start gap-1 sm:w-fit'>
            <TabsTrigger value='overview'>نمای کلی</TabsTrigger>
            <TabsTrigger value='timeline'>زمان‌بندی</TabsTrigger>
            <TabsTrigger value='documents'>مدارک</TabsTrigger>
            <TabsTrigger value='sessions'>جلسات</TabsTrigger>
            <TabsTrigger value='payments'>پرداخت‌ها</TabsTrigger>
            <TabsTrigger value='lawyer'>وکیل</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-4'>
            <section className='rounded-xl border p-4 sm:p-5'>
              <h2 className='text-sm font-semibold'>توضیحات پرونده</h2>
              <p className='mt-2 text-sm leading-7 text-muted-foreground'>
                {caseItem.description || 'توضیحی ثبت نشده است.'}
              </p>
            </section>
            <section className='grid gap-3 sm:grid-cols-3'>
              <div className='rounded-xl border p-4'>
                <p className='text-xs text-muted-foreground'>آخرین بروزرسانی</p>
                <p className='mt-1 font-medium'>
                  {formatDate(caseItem.updatedAt)}
                </p>
              </div>
              <div className='rounded-xl border p-4'>
                <p className='text-xs text-muted-foreground'>تعداد مدارک</p>
                <p className='mt-1 font-medium tabular-nums'>
                  {caseItem.documents.length.toLocaleString('fa-IR')}
                </p>
              </div>
              <div className='rounded-xl border p-4'>
                <p className='text-xs text-muted-foreground'>جلسات مرتبط</p>
                <p className='mt-1 font-medium tabular-nums'>
                  {sessions.length.toLocaleString('fa-IR')}
                </p>
              </div>
            </section>
          </TabsContent>

          <TabsContent value='timeline'>
            {timeline.length === 0 ? (
              <p className='rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground'>
                رویدادی برای این پرونده ثبت نشده است.
              </p>
            ) : (
              <ol className='relative space-y-0 border-s border-border ms-3'>
                {timeline.map((event) => (
                  <li key={event.id} className='relative pb-6 ps-6 last:pb-0'>
                    <span className='absolute start-0 top-1.5 size-2.5 -translate-x-1/2 rounded-full bg-foreground rtl:translate-x-1/2' />
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='font-medium'>{event.title}</p>
                      <span className='rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground'>
                        {TIMELINE_LABELS[event.type]}
                      </span>
                    </div>
                    {event.description ? (
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {event.description}
                      </p>
                    ) : null}
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {formatDateTime(event.occurredAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>

          <TabsContent value='documents'>
            {caseItem.documents.length === 0 ? (
              <p className='rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground'>
                مدرکی برای این پرونده ثبت نشده است.
              </p>
            ) : (
              <ul className='divide-y rounded-xl border'>
                {caseItem.documents.map((doc) => (
                  <li
                    key={doc.id}
                    className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'
                  >
                    <div className='flex min-w-0 items-start gap-3'>
                      <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted'>
                        <FileText className='size-4 text-muted-foreground' />
                      </div>
                      <div className='min-w-0 space-y-1'>
                        <p className='truncate font-medium'>{doc.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {formatMimeTypeLabel(doc.mimeType)} ·{' '}
                          {formatFileSize(doc.size)} ·{' '}
                          {formatDate(doc.uploadedAt)}
                        </p>
                        <DocumentStatusBadge status={doc.status} />
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={doc.status !== 'available'}
                      onClick={() => {
                        // Prototype: فایل واقعی ذخیره نمی‌شود
                        window.alert(
                          `در نسخه نمونه، دانلود «${doc.name}» شبیه‌سازی شده است.`
                        )
                      }}
                    >
                      <Download className='size-4' />
                      دانلود
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value='sessions'>
            {sessions.length === 0 ? (
              <p className='rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground'>
                جلسه‌ای مرتبط با این پرونده نیست.
              </p>
            ) : (
              <ul className='divide-y rounded-xl border'>
                {[...sessions]
                  .sort(
                    (a, b) =>
                      new Date(b.startsAt).getTime() -
                      new Date(a.startsAt).getTime()
                  )
                  .map((item) => (
                    <li
                      key={item.id}
                      className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'
                    >
                      <div className='min-w-0 space-y-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='font-medium'>{item.title}</p>
                          <SessionStatusBadge status={item.status} />
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {SESSION_TYPE_LABELS[item.type]} ·{' '}
                          {formatDate(item.startsAt)} ·{' '}
                          {formatTime(item.startsAt)}
                        </p>
                      </div>
                      <Button variant='outline' size='sm' asChild>
                        <Link href={`/sessions/${item.id}`}>جزئیات</Link>
                      </Button>
                    </li>
                  ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value='payments'>
            {payments.length === 0 ? (
              <p className='rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground'>
                پرداختی مرتبط با این پرونده نیست.
              </p>
            ) : (
              <ul className='divide-y rounded-xl border'>
                {[...payments]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((item) => (
                    <li
                      key={item.id}
                      className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'
                    >
                      <div className='min-w-0 space-y-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='font-medium'>{item.title}</p>
                          <PaymentStatusBadge status={item.status} />
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {formatMoney(item.amount)} ·{' '}
                          {formatDate(item.paidAt ?? item.createdAt)}
                        </p>
                      </div>
                      <Button variant='outline' size='sm' asChild>
                        <Link href={`/payments?payment=${item.id}`}>
                          جزئیات
                        </Link>
                      </Button>
                    </li>
                  ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value='lawyer'>
            {!lawyer ? (
              <p className='rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground'>
                اطلاعات وکیل در دسترس نیست.
              </p>
            ) : (
              <section className='rounded-xl border p-4 sm:p-5'>
                <h2 className='text-lg font-semibold'>{lawyer.name}</h2>
                {lawyer.title ? (
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {lawyer.title}
                  </p>
                ) : null}
                <dl className='mt-4 grid gap-3 text-sm sm:grid-cols-2'>
                  <div>
                    <dt className='text-muted-foreground'>تخصص</dt>
                    <dd className='mt-0.5 font-medium'>{lawyer.specialty}</dd>
                  </div>
                  {lawyer.barNumber ? (
                    <div>
                      <dt className='text-muted-foreground'>شماره پروانه</dt>
                      <dd className='mt-0.5 font-medium tabular-nums'>
                        {lawyer.barNumber}
                      </dd>
                    </div>
                  ) : null}
                  <div className='flex items-center gap-2'>
                    <Phone className='size-4 text-muted-foreground' />
                    <a
                      href={`tel:${lawyer.phone}`}
                      className='font-medium tabular-nums hover:underline'
                    >
                      {lawyer.phone}
                    </a>
                  </div>
                  {lawyer.email ? (
                    <div className='flex items-center gap-2'>
                      <Mail className='size-4 text-muted-foreground' />
                      <a
                        href={`mailto:${lawyer.email}`}
                        className='font-medium hover:underline'
                      >
                        {lawyer.email}
                      </a>
                    </div>
                  ) : null}
                </dl>
              </section>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  )
}
