'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Laptop,
  Smartphone,
  Tablet,
  MapPin,
  LogOut,
  ShieldCheck,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { formatRelativeTimeFa } from '@/lib/format-relative-time'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type DeviceKind = 'desktop' | 'mobile' | 'tablet'

type Session = {
  id: string
  device: string
  browser: string
  ipAddress: string | null
  createdAt: string
  current?: boolean
  kind: DeviceKind
}

function DeviceIcon({ kind }: { kind: DeviceKind }) {
  const Icon =
    kind === 'mobile' ? Smartphone : kind === 'tablet' ? Tablet : Laptop
  return <Icon className='size-5' strokeWidth={1.75} />
}

function formatLocation(ip: string | null): string {
  return ip?.trim() ? `آی‌پی: ${ip}` : 'موقعیت نامشخص'
}

function formatLastActive(session: Session): string {
  if (session.current) return 'اکنون فعال'
  return formatRelativeTimeFa(session.createdAt)
}

export function SessionsTab() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokingOthers, setRevokingOthers] = useState(false)

  const loadSessions = useCallback(async () => {
    setLoading(true)
    const result = await api<{ sessions: Session[] }>('/api/auth/sessions')
    setLoading(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setSessions(result.data.sessions)
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  async function revoke(id: string) {
    setRevokingId(id)
    const result = await api<{ revoked: boolean }>(`/api/auth/sessions/${id}`, {
      method: 'DELETE',
    })
    setRevokingId(null)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setSessions((prev) => prev.filter((s) => s.id !== id))
    toast.success('دستگاه از حساب خارج شد.')
  }

  async function revokeOthers() {
    setRevokingOthers(true)
    const result = await api<{ revokedCount: number }>(
      '/api/auth/sessions/revoke-others',
      { method: 'POST' }
    )
    setRevokingOthers(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setSessions((prev) => prev.filter((s) => s.current))
    toast.success('از همه دستگاه‌های دیگر خارج شدید.')
  }

  const othersCount = sessions.filter((s) => !s.current).length

  if (loading) {
    return (
      <div className='space-y-8'>
        <div className='space-y-2'>
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-4 w-64' />
        </div>
        <Skeleton className='h-48 w-full rounded-2xl' />
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h2 className='text-base font-semibold tracking-tight text-sidebar-foreground'>
            نشست‌ها
          </h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            دستگاه‌هایی که به حساب شما وارد شده‌اند
          </p>
        </div>
        {othersCount > 0 ? (
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='shrink-0 gap-1.5 border-sidebar-border bg-sidebar text-destructive hover:bg-destructive/5 hover:text-destructive'
            onClick={() => void revokeOthers()}
            disabled={revokingOthers}
          >
            {revokingOthers ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <LogOut className='size-3.5' />
            )}
            خروج از بقیه دستگاه‌ها
          </Button>
        ) : null}
      </div>

      <ul className='overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm'>
        {sessions.map((session, index) => (
          <li
            key={session.id}
            className={cn(
              'flex items-start gap-4 px-5 py-4 sm:items-center sm:px-6',
              index > 0 && 'border-t border-sidebar-border'
            )}
          >
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl',
                session.current
                  ? 'bg-sidebar-primary/10 text-sidebar-primary'
                  : 'bg-sidebar-accent text-muted-foreground'
              )}
            >
              <DeviceIcon kind={session.kind} />
            </div>

            <div className='min-w-0 flex-1 space-y-1.5'>
              <div className='flex flex-wrap items-center gap-2'>
                <p className='text-sm font-semibold'>
                  {session.browser}
                  <span className='font-normal text-muted-foreground'>
                    {' '}
                    · {session.device}
                  </span>
                </p>
                {session.current ? (
                  <Badge
                    variant='secondary'
                    className='gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  >
                    <ShieldCheck className='size-3' />
                    این دستگاه
                  </Badge>
                ) : null}
              </div>
              <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
                <span className='inline-flex items-center gap-1'>
                  <MapPin className='size-3.5' />
                  {formatLocation(session.ipAddress)}
                </span>
                <span className='size-1 rounded-full bg-border' />
                <span>{formatLastActive(session)}</span>
              </div>
            </div>

            {!session.current ? (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='shrink-0 text-muted-foreground hover:text-destructive'
                onClick={() => void revoke(session.id)}
                disabled={revokingId === session.id}
              >
                {revokingId === session.id ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  'خروج'
                )}
              </Button>
            ) : null}
          </li>
        ))}

        {sessions.length === 0 ? (
          <li className='px-6 py-10 text-center text-sm text-muted-foreground'>
            نشست فعالی وجود ندارد.
          </li>
        ) : null}
      </ul>
    </div>
  )
}
