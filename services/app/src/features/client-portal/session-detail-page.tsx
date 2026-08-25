'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarClock, MapPin, Video } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useState } from 'react'
import { usePortalHydration } from './hooks/use-portal-hydration'
import { usePortalStore } from './stores/portal-store'
import {
  PageShell,
  PortalDetailSkeleton,
} from './components/page-shell'
import { ErrorState } from './components/error-state'
import { SessionStatusBadge } from './components/status-badges'
import { SESSION_TYPE_LABELS } from './types'
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatTime,
} from './utils/format'

type ClientSessionDetailPageProps = {
  sessionId: string
}

export function ClientSessionDetailPage({
  sessionId,
}: ClientSessionDetailPageProps) {
  const router = useRouter()
  const { hydrated } = usePortalHydration()
  const session = usePortalStore((s) => s.getSession(sessionId))
  const lawyer = usePortalStore((s) =>
    session ? s.getLawyer(session.lawyerId) : null
  )
  const caseItem = usePortalStore((s) =>
    session?.caseId ? s.getCase(session.caseId) : null
  )
  const cancelSession = usePortalStore((s) => s.cancelSession)
  const error = usePortalStore((s) => s.error)
  const hydrate = usePortalStore((s) => s.hydrate)
  const [cancelOpen, setCancelOpen] = useState(false)

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

  if (!session) {
    return (
      <PageShell>
        <div className='space-y-4'>
          <Button variant='ghost' size='sm' className='h-8 px-2' asChild>
            <Link href='/sessions'>
              <ArrowRight className='size-4' />
              جلسات
            </Link>
          </Button>
          <ErrorState message='جلسه مورد نظر یافت نشد.' />
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className='space-y-6'>
        <div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
          <Button variant='ghost' size='sm' className='h-8 px-2' asChild>
            <Link href='/sessions'>
              <ArrowRight className='size-4' />
              جلسات
            </Link>
          </Button>
          <span>/</span>
          <span className='truncate text-foreground'>{session.title}</span>
        </div>

        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <h1 className='text-xl font-bold tracking-tight sm:text-2xl'>
                {session.title}
              </h1>
              <SessionStatusBadge status={session.status} />
            </div>
            <p className='text-sm text-muted-foreground'>
              {SESSION_TYPE_LABELS[session.type]}
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            {session.meetingUrl &&
            (session.status === 'scheduled' ||
              session.status === 'confirmed') ? (
              <Button asChild>
                <a
                  href={session.meetingUrl}
                  target='_blank'
                  rel='noreferrer'
                >
                  <Video className='size-4' />
                  ورود به جلسه
                </a>
              </Button>
            ) : null}
            {session.canCancel ? (
              <Button variant='outline' onClick={() => setCancelOpen(true)}>
                لغو جلسه
              </Button>
            ) : null}
            {session.canReschedule ? (
              <Button
                variant='outline'
                onClick={() =>
                  toast.message('درخواست تغییر زمان', {
                    description:
                      'درخواست شما برای وکیل ارسال شد. پس از تأیید، زمان جدید اعلام می‌شود.',
                  })
                }
              >
                <CalendarClock className='size-4' />
                درخواست تغییر زمان
              </Button>
            ) : null}
          </div>
        </div>

        <section className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          <div className='rounded-xl border p-4'>
            <p className='text-xs text-muted-foreground'>تاریخ</p>
            <p className='mt-1 font-medium'>{formatDate(session.startsAt)}</p>
          </div>
          <div className='rounded-xl border p-4'>
            <p className='text-xs text-muted-foreground'>ساعت</p>
            <p className='mt-1 font-medium'>{formatTime(session.startsAt)}</p>
          </div>
          <div className='rounded-xl border p-4'>
            <p className='text-xs text-muted-foreground'>مدت</p>
            <p className='mt-1 font-medium'>
              {formatDuration(session.durationMinutes)}
            </p>
          </div>
          <div className='rounded-xl border p-4'>
            <p className='text-xs text-muted-foreground'>وکیل</p>
            <p className='mt-1 font-medium'>{lawyer?.name ?? '—'}</p>
          </div>
          <div className='rounded-xl border p-4 sm:col-span-2'>
            <p className='text-xs text-muted-foreground'>پرونده مرتبط</p>
            {caseItem ? (
              <Link
                href={`/cases/${caseItem.id}`}
                className='mt-1 inline-block font-medium hover:underline'
              >
                {caseItem.title}
              </Link>
            ) : (
              <p className='mt-1 font-medium'>—</p>
            )}
          </div>
        </section>

        {(session.location || session.meetingUrl) && (
          <section className='rounded-xl border p-4 sm:p-5'>
            <h2 className='flex items-center gap-2 text-sm font-semibold'>
              <MapPin className='size-4 text-muted-foreground' />
              محل برگزاری
            </h2>
            {session.location ? (
              <p className='mt-2 text-sm text-muted-foreground'>
                {session.location}
              </p>
            ) : null}
            {session.meetingUrl ? (
              <a
                href={session.meetingUrl}
                target='_blank'
                rel='noreferrer'
                className='mt-2 inline-block text-sm text-primary hover:underline'
              >
                {session.meetingUrl}
              </a>
            ) : null}
          </section>
        )}

        <section className='rounded-xl border p-4 sm:p-5'>
          <h2 className='text-sm font-semibold'>توضیحات</h2>
          <p className='mt-2 text-sm leading-7 text-muted-foreground'>
            {session.description || 'توضیحی برای این جلسه ثبت نشده است.'}
          </p>
          <p className='mt-3 text-xs text-muted-foreground'>
            آخرین بروزرسانی: {formatDateTime(session.updatedAt)}
          </p>
        </section>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title='لغو جلسه'
        desc={
          <>
            آیا از لغو جلسه «<strong>{session.title}</strong>» در تاریخ{' '}
            <strong>{formatDate(session.startsAt)}</strong> مطمئن هستید؟
          </>
        }
        confirmText='لغو جلسه'
        destructive
        handleConfirm={() => {
          const result = cancelSession(session.id)
          if (!result.ok) {
            toast.error(result.error)
            return
          }
          toast.success('جلسه با موفقیت لغو شد.')
          setCancelOpen(false)
          router.refresh()
        }}
      />
    </PageShell>
  )
}
