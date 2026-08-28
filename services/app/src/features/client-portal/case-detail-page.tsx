'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  Info,
  Mail,
  Phone,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  PaymentStatusBadge,
  SessionStatusBadge,
} from './components/status-badges'
import { CaseOverviewTab } from './components/case-detail/case-overview-tab'
import { CaseCommentsTab } from './components/case-detail/case-comments-tab'
import { CaseDocumentsTab } from './components/case-detail/case-documents-tab'
import {
  CASE_CREATED_BY_LABELS,
  LEGAL_AREA_LABELS,
  SESSION_TYPE_LABELS,
  type TimelineEventType,
} from './types'
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatTime,
} from './utils/format'
import * as apiNotifications from '@/features/notifications/services/api-notifications-service'
import { useNotificationsStore } from '@/features/notifications/stores/notifications-store'
import { useUnseenActivityStore } from '@/features/notifications/stores/unseen-activity-store'

const CLIENT_CASE_TABS = [
  'overview',
  'comments',
  'documents',
  'timeline',
  'sessions',
  'payments',
  'lawyer',
] as const

type ClientCaseTab = (typeof CLIENT_CASE_TABS)[number]

function parseClientCaseTab(value: string | null): ClientCaseTab {
  if (value === 'attachments') return 'documents'
  if (value && CLIENT_CASE_TABS.includes(value as ClientCaseTab)) {
    return value as ClientCaseTab
  }
  return 'overview'
}

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { hydrated } = usePortalHydration()
  const refreshUnreadCount = useNotificationsStore(
    (state) => state.refreshUnreadCount
  )
  const refreshUnseen = useUnseenActivityStore((state) => state.refresh)

  const initialTab = useMemo(
    () => parseClientCaseTab(searchParams.get('tab')),
    [searchParams]
  )
  const [tab, setTab] = useState<ClientCaseTab>(initialTab)

  useEffect(() => {
    setTab(parseClientCaseTab(searchParams.get('tab')))
  }, [searchParams])

  useEffect(() => {
    if (tab !== 'comments' && tab !== 'documents') return
    void apiNotifications.markCaseNotificationsRead(caseId).then(() => {
      void refreshUnreadCount()
      void refreshUnseen(false)
    })
  }, [caseId, refreshUnreadCount, refreshUnseen, tab])

  const handleTabChange = useCallback(
    (value: string) => {
      const nextTab = parseClientCaseTab(value)
      setTab(nextTab)
      const params = new URLSearchParams(searchParams.toString())
      if (nextTab === 'overview') {
        params.delete('tab')
      } else {
        params.set('tab', nextTab)
      }
      const qs = params.toString()
      router.replace(qs ? `/cases/${caseId}?${qs}` : `/cases/${caseId}`, {
        scroll: false,
      })

      if (nextTab === 'comments' || nextTab === 'documents') {
        void apiNotifications.markCaseNotificationsRead(caseId).then(() => {
          void refreshUnreadCount()
          void refreshUnseen(false)
        })
      }
    },
    [caseId, refreshUnreadCount, refreshUnseen, router, searchParams]
  )

  const caseItem = usePortalStore((s) =>
    s.cases.find((item) => item.id === caseId)
  )
  const lawyerId = caseItem?.lawyerId
  const lawyer = usePortalStore((s) =>
    lawyerId ? (s.lawyers.find((item) => item.id === lawyerId) ?? null) : null
  )
  const allSessions = usePortalStore((s) => s.sessions)
  const allPayments = usePortalStore((s) => s.payments)
  const error = usePortalStore((s) => s.error)
  const hydrate = usePortalStore((s) => s.hydrate)

  const sessions = useMemo(
    () => allSessions.filter((item) => item.caseId === caseId),
    [allSessions, caseId]
  )
  const payments = useMemo(
    () => allPayments.filter((item) => item.caseId === caseId),
    [allPayments, caseId]
  )

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

  const timeline = [...(caseItem.timeline ?? [])].sort(
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
            <span className='rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground'>
              {CASE_CREATED_BY_LABELS[caseItem.createdBy]}
            </span>
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

        <Alert>
          <Info className='size-4' />
          <AlertDescription>
            این پرونده قابل ویرایش نیست. برای پیگیری، پیام بگذارید یا مدرک
            پیوست کنید.
          </AlertDescription>
        </Alert>

        <Tabs value={tab} onValueChange={handleTabChange} className='gap-4'>
          <TabsList className='flex h-auto w-full flex-wrap justify-start gap-1 sm:w-fit'>
            <TabsTrigger value='overview'>نمای کلی</TabsTrigger>
            <TabsTrigger value='comments'>
              گفتگو
              {(caseItem.comments?.length ?? 0) > 0 ? (
                <span className='ms-1 tabular-nums text-muted-foreground'>
                  ({caseItem.comments.length.toLocaleString('fa-IR')})
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value='documents'>مدارک</TabsTrigger>
            <TabsTrigger value='timeline'>زمان‌بندی</TabsTrigger>
            <TabsTrigger value='sessions'>جلسات</TabsTrigger>
            <TabsTrigger value='payments'>پرداخت‌ها</TabsTrigger>
            <TabsTrigger value='lawyer'>وکیل</TabsTrigger>
          </TabsList>

          <TabsContent value='overview'>
            {tab === 'overview' ? (
              <CaseOverviewTab
                caseItem={caseItem}
                lawyer={lawyer}
                sessionsCount={sessions.length}
                commentsCount={caseItem.comments?.length ?? 0}
              />
            ) : null}
          </TabsContent>

          <TabsContent value='comments'>
            {tab === 'comments' ? (
              <CaseCommentsTab caseItem={caseItem} />
            ) : null}
          </TabsContent>

          <TabsContent value='documents'>
            {tab === 'documents' ? (
              <CaseDocumentsTab caseItem={caseItem} />
            ) : null}
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
