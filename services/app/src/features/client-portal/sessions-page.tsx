'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePortalHydration } from './hooks/use-portal-hydration'
import { usePortalStore } from './stores/portal-store'
import { PageShell, PortalListSkeleton } from './components/page-shell'
import { ErrorState } from './components/error-state'
import { EmptyState } from './components/empty-state'
import { SessionStatusBadge } from './components/status-badges'
import { SESSION_TYPE_LABELS, type ClientSession } from './types'
import {
  formatDate,
  formatDuration,
  formatTime,
} from './utils/format'
import { JoinCallButton } from '@/features/video-call/components/join-call-button'
import {
  isOnlineVideoSession,
  sessionToCallTimes,
} from '@/features/video-call/utils'

function isUpcoming(session: ClientSession): boolean {
  return (
    new Date(session.startsAt).getTime() >= Date.now() &&
    session.status !== 'cancelled' &&
    session.status !== 'completed' &&
    session.status !== 'no_show'
  )
}

function SessionCard({
  session,
  lawyerName,
  caseTitle,
}: {
  session: ClientSession
  lawyerName: string
  caseTitle: string
}) {
  return (
    <li className='rounded-xl border p-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0 space-y-2'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='font-semibold tracking-tight'>{session.title}</h3>
            <SessionStatusBadge status={session.status} />
          </div>
          <dl className='grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm'>
            <div>
              <dt className='text-muted-foreground'>نوع</dt>
              <dd className='mt-0.5 font-medium'>
                {SESSION_TYPE_LABELS[session.type]}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>وکیل</dt>
              <dd className='mt-0.5 font-medium'>{lawyerName}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>پرونده</dt>
              <dd className='mt-0.5 font-medium'>{caseTitle}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>مدت</dt>
              <dd className='mt-0.5 font-medium'>
                {formatDuration(session.durationMinutes)}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>تاریخ</dt>
              <dd className='mt-0.5 font-medium'>
                {formatDate(session.startsAt)}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>ساعت</dt>
              <dd className='mt-0.5 font-medium'>
                {formatTime(session.startsAt)}
              </dd>
            </div>
            {(session.location || session.meetingUrl) && (
              <div className='col-span-2'>
                <dt className='text-muted-foreground'>محل / لینک</dt>
                <dd className='mt-0.5 font-medium'>
                  {session.meetingUrl ? (
                    <a
                      href={session.meetingUrl}
                      target='_blank'
                      rel='noreferrer'
                      className='text-primary hover:underline'
                    >
                      جلسه آنلاین
                    </a>
                  ) : (
                    session.location
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className='flex shrink-0 flex-wrap gap-2'>
          {isOnlineVideoSession(session) && isUpcoming(session) ? (
            <JoinCallButton
              eventId={session.id}
              {...sessionToCallTimes(session)}
              status={
                session.status === 'confirmed' ? 'scheduled' : session.status
              }
              size='sm'
            />
          ) : null}
          <Button variant='outline' size='sm' asChild>
            <Link href={`/sessions/${session.id}`}>جزئیات</Link>
          </Button>
        </div>
      </div>
    </li>
  )
}

function groupByDate(sessions: ClientSession[]): [string, ClientSession[]][] {
  const map = new Map<string, ClientSession[]>()
  for (const session of sessions) {
    const key = formatDate(session.startsAt)
    const list = map.get(key) ?? []
    list.push(session)
    map.set(key, list)
  }
  return Array.from(map.entries())
}

export function ClientSessionsPage() {
  const { hydrated } = usePortalHydration()
  const sessions = usePortalStore((s) => s.sessions)
  const cases = usePortalStore((s) => s.cases)
  const lawyers = usePortalStore((s) => s.lawyers)
  const error = usePortalStore((s) => s.error)
  const hydrate = usePortalStore((s) => s.hydrate)

  const { upcoming, past } = useMemo(() => {
    const upcomingList = sessions
      .filter(isUpcoming)
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      )
    const pastList = sessions
      .filter((s) => !isUpcoming(s))
      .sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
      )
    return { upcoming: upcomingList, past: pastList }
  }, [sessions])

  const getLawyerName = (id: string) =>
    lawyers.find((l) => l.id === id)?.name ?? '—'
  const getCaseTitle = (caseId: string | null) =>
    caseId
      ? (cases.find((c) => c.id === caseId)?.title ?? '—')
      : 'بدون پرونده'

  return (
    <PageShell
      title='جلسات'
      description='جلسات مشاوره، دادگاه و پیگیری خود را مشاهده و مدیریت کنید.'
    >
      {!hydrated ? (
        <PortalListSkeleton cards={0} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => hydrate()} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title='هنوز جلسه‌ای برای شما ثبت نشده است.'
          description='پس از هماهنگی جلسه با وکیل، جزئیات آن در این بخش نمایش داده می‌شود.'
        />
      ) : (
        <div className='space-y-8'>
          <section id='upcoming' className='space-y-4 scroll-mt-24'>
            <div className='flex items-baseline justify-between gap-2'>
              <h2 className='text-base font-semibold tracking-tight'>
                جلسات پیش‌رو
              </h2>
              <span className='text-xs text-muted-foreground tabular-nums'>
                {upcoming.length.toLocaleString('fa-IR')} جلسه
              </span>
            </div>
            {upcoming.length === 0 ? (
              <p className='rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground'>
                جلسه پیش‌رویی ندارید.
              </p>
            ) : (
              groupByDate(upcoming).map(([date, items]) => (
                <div key={date} className='space-y-2'>
                  <h3 className='text-sm font-medium text-muted-foreground'>
                    {date}
                  </h3>
                  <ul className='space-y-3'>
                    {items.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        lawyerName={getLawyerName(session.lawyerId)}
                        caseTitle={getCaseTitle(session.caseId)}
                      />
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>

          <section className='space-y-4'>
            <div className='flex items-baseline justify-between gap-2'>
              <h2 className='text-base font-semibold tracking-tight'>
                جلسات گذشته
              </h2>
              <span className='text-xs text-muted-foreground tabular-nums'>
                {past.length.toLocaleString('fa-IR')} جلسه
              </span>
            </div>
            {past.length === 0 ? (
              <p className='rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground'>
                جلسه گذشته‌ای ثبت نشده است.
              </p>
            ) : (
              <ul className='space-y-3'>
                {past.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    lawyerName={getLawyerName(session.lawyerId)}
                    caseTitle={getCaseTitle(session.caseId)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </PageShell>
  )
}
