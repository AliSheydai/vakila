'use client'

import Link from 'next/link'
import {
  Briefcase,
  Calendar,
  CreditCard,
  FolderOpen,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePortalHydration } from './hooks/use-portal-hydration'
import { usePortalStore } from './stores/portal-store'
import {
  PageShell,
  PortalListSkeleton,
} from './components/page-shell'
import { SummaryCard } from './components/summary-card'
import { ErrorState } from './components/error-state'
import { CaseStatusBadge, PaymentStatusBadge, SessionStatusBadge } from './components/status-badges'
import { formatDate, formatMoney, formatTime } from './utils/format'
import { SESSION_TYPE_LABELS } from './types'
import { JoinCallButton } from '@/features/video-call/components/join-call-button'
import {
  isOnlineVideoSession,
  sessionToCallTimes,
} from '@/features/video-call/utils'
import { TelegramBotEntry } from '@/components/messenger/telegram-bot-entry'

function isUpcoming(startsAt: string): boolean {
  return new Date(startsAt).getTime() >= Date.now()
}

export function ClientDashboardPage() {
  const { hydrated } = usePortalHydration()
  const profile = usePortalStore((s) => s.profile)
  const cases = usePortalStore((s) => s.cases)
  const sessions = usePortalStore((s) => s.sessions)
  const payments = usePortalStore((s) => s.payments)
  const lawyers = usePortalStore((s) => s.lawyers)
  const error = usePortalStore((s) => s.error)
  const hydrate = usePortalStore((s) => s.hydrate)

  const activeCases = cases.filter((c) => c.status === 'active').length
  const upcomingSessions = sessions
    .filter(
      (s) =>
        isUpcoming(s.startsAt) &&
        (s.status === 'scheduled' || s.status === 'confirmed')
    )
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    )
  const pendingPayments = payments.filter((p) => p.status === 'pending')
  const recentCases = [...cases]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 4)
  const recentPayments = [...payments]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 4)

  const getLawyerName = (id: string) =>
    lawyers.find((l) => l.id === id)?.name ?? '—'

  return (
    <PageShell>
      {!hydrated ? (
        <PortalListSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={() => hydrate()} />
      ) : (
        <div className='space-y-6 sm:space-y-8'>
          <section className='space-y-2'>
            <h1 className='font-display text-xl font-bold tracking-tight sm:text-2xl'>
              سلام، {profile?.name ?? 'موکل'} عزیز
            </h1>
            <p className='max-w-2xl text-sm text-muted-foreground sm:text-base'>
              در اینجا می‌توانید وضعیت پرونده‌ها، جلسات و پرداخت‌های خود را مشاهده
              کنید.
            </p>
          </section>

          <TelegramBotEntry />

          <section className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
            <SummaryCard
              title='پرونده‌های فعال'
              value={activeCases}
              icon={Briefcase}
              href='/cases?status=active'
              hint='در حال پیگیری'
            />
            <SummaryCard
              title='جلسات پیش‌رو'
              value={upcomingSessions.length}
              icon={Calendar}
              href='/sessions'
              hint='برنامه‌ریزی‌شده'
            />
            <SummaryCard
              title='پرداخت‌های در انتظار'
              value={pendingPayments.length}
              icon={CreditCard}
              href='/payments?status=pending'
              hint='نیازمند اقدام'
            />
            <SummaryCard
              title='مجموع پرونده‌ها'
              value={cases.length}
              icon={FolderOpen}
              href='/cases'
            />
          </section>

          <section className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {[
              { href: '/cases', label: 'مشاهده پرونده‌ها', icon: FolderOpen },
              { href: '/sessions', label: 'مشاهده جلسات', icon: Calendar },
              {
                href: '/sessions#upcoming',
                label: 'رزرو / جلسات پیش‌رو',
                icon: Calendar,
              },
              { href: '/payments', label: 'پرداخت‌ها', icon: CreditCard },
            ].map((action) => (
              <Button
                key={action.href + action.label}
                variant='outline'
                className='h-auto justify-start gap-3 px-4 py-3'
                asChild
              >
                <Link href={action.href}>
                  <action.icon className='size-4 shrink-0 text-muted-foreground' />
                  <span>{action.label}</span>
                </Link>
              </Button>
            ))}
          </section>

          <div className='grid gap-6 lg:grid-cols-2'>
            <section className='space-y-3'>
              <div className='flex items-center justify-between gap-2'>
                <h2 className='text-base font-semibold tracking-tight'>
                  پرونده‌های اخیر
                </h2>
                <Button variant='ghost' size='sm' asChild>
                  <Link href='/cases'>
                    همه
                    <ArrowLeft className='size-3.5' />
                  </Link>
                </Button>
              </div>
              {recentCases.length === 0 ? (
                <p className='rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground'>
                  هنوز پرونده‌ای ثبت نشده است. از بخش پرونده‌ها می‌توانید پرونده
                  جدید ثبت کنید.
                </p>
              ) : (
                <ul className='divide-y rounded-xl border'>
                  {recentCases.map((item) => (
                    <li
                      key={item.id}
                      className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'
                    >
                      <div className='min-w-0 space-y-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='truncate font-medium'>{item.title}</p>
                          <CaseStatusBadge status={item.status} />
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {item.caseNumber} · {getLawyerName(item.lawyerId)} ·{' '}
                          {formatDate(item.updatedAt)}
                        </p>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        asChild
                      >
                        <Link href={`/cases/${item.id}`}>مشاهده</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className='space-y-3'>
              <div className='flex items-center justify-between gap-2'>
                <h2 className='text-base font-semibold tracking-tight'>
                  جلسات پیش‌رو
                </h2>
                <Button variant='ghost' size='sm' asChild>
                  <Link href='/sessions'>
                    همه
                    <ArrowLeft className='size-3.5' />
                  </Link>
                </Button>
              </div>
              {upcomingSessions.length === 0 ? (
                <p className='rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground'>
                  جلسه پیش‌رویی ندارید.
                </p>
              ) : (
                <ul className='divide-y rounded-xl border'>
                  {upcomingSessions.slice(0, 4).map((item) => (
                    <li
                      key={item.id}
                      className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'
                    >
                      <div className='min-w-0 space-y-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='truncate font-medium'>{item.title}</p>
                          <SessionStatusBadge status={item.status} />
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {formatDate(item.startsAt)} · {formatTime(item.startsAt)}{' '}
                          · {SESSION_TYPE_LABELS[item.type]} ·{' '}
                          {getLawyerName(item.lawyerId)}
                        </p>
                      </div>
                      <div className='flex shrink-0 gap-2'>
                        {isOnlineVideoSession(item) && isUpcoming(item.startsAt) ? (
                          <JoinCallButton
                            eventId={item.id}
                            {...sessionToCallTimes(item)}
                            status={
                              item.status === 'confirmed'
                                ? 'scheduled'
                                : item.status
                            }
                            size='sm'
                          />
                        ) : null}
                        <Button variant='outline' size='sm' asChild>
                          <Link href={`/sessions/${item.id}`}>جزئیات</Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className='space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <h2 className='text-base font-semibold tracking-tight'>
                آخرین پرداخت‌ها
              </h2>
              <Button variant='ghost' size='sm' asChild>
                <Link href='/payments'>
                  همه
                  <ArrowLeft className='size-3.5' />
                </Link>
              </Button>
            </div>
            {recentPayments.length === 0 ? (
              <p className='rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground'>
                پرداختی ثبت نشده است.
              </p>
            ) : (
              <ul className='divide-y rounded-xl border'>
                {recentPayments.map((item) => (
                  <li
                    key={item.id}
                    className='flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between'
                  >
                    <div className='min-w-0 space-y-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <p className='truncate font-medium'>{item.title}</p>
                        <PaymentStatusBadge status={item.status} />
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        {formatMoney(item.amount)} ·{' '}
                        {formatDate(item.paidAt ?? item.createdAt)}
                        {item.transactionId
                          ? ` · ${item.transactionId}`
                          : ''}
                      </p>
                    </div>
                    <Button variant='outline' size='sm' asChild>
                      <Link href={`/payments?payment=${item.id}`}>مشاهده</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </PageShell>
  )
}
