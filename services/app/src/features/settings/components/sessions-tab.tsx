'use client'

import { useState } from 'react'
import {
  Laptop,
  Smartphone,
  Tablet,
  MapPin,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type DeviceKind = 'desktop' | 'mobile' | 'tablet'

type Session = {
  id: string
  device: string
  browser: string
  location: string
  lastActive: string
  current?: boolean
  kind: DeviceKind
}

const INITIAL_SESSIONS: Session[] = [
  {
    id: '1',
    device: 'Windows',
    browser: 'Chrome',
    location: 'تهران، ایران',
    lastActive: 'اکنون فعال',
    current: true,
    kind: 'desktop',
  },
  {
    id: '2',
    device: 'iPhone',
    browser: 'Safari',
    location: 'تهران، ایران',
    lastActive: '۲ ساعت پیش',
    kind: 'mobile',
  },
  {
    id: '3',
    device: 'iPad',
    browser: 'Safari',
    location: 'اصفهان، ایران',
    lastActive: '۳ روز پیش',
    kind: 'tablet',
  },
]

function DeviceIcon({ kind }: { kind: DeviceKind }) {
  const Icon =
    kind === 'mobile' ? Smartphone : kind === 'tablet' ? Tablet : Laptop
  return <Icon className='size-5' strokeWidth={1.75} />
}

export function SessionsTab() {
  const [sessions, setSessions] = useState(INITIAL_SESSIONS)

  function revoke(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    toast.success('دستگاه از حساب خارج شد.')
  }

  function revokeOthers() {
    setSessions((prev) => prev.filter((s) => s.current))
    toast.success('از همه دستگاه‌های دیگر خارج شدید.')
  }

  const othersCount = sessions.filter((s) => !s.current).length

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h2 className='text-base font-semibold tracking-tight'>نشست‌ها</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            دستگاه‌هایی که به حساب شما وارد شده‌اند
          </p>
        </div>
        {othersCount > 0 ? (
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='shrink-0 gap-1.5 text-destructive hover:bg-destructive/5 hover:text-destructive'
            onClick={revokeOthers}
          >
            <LogOut className='size-3.5' />
            خروج از بقیه دستگاه‌ها
          </Button>
        ) : null}
      </div>

      <ul className='overflow-hidden rounded-2xl border bg-card'>
        {sessions.map((session, index) => (
          <li
            key={session.id}
            className={cn(
              'flex items-start gap-4 px-5 py-4 sm:items-center sm:px-6',
              index > 0 && 'border-t'
            )}
          >
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl',
                session.current
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
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
                  {session.location}
                </span>
                <span className='size-1 rounded-full bg-border' />
                <span>{session.lastActive}</span>
              </div>
            </div>

            {!session.current ? (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='shrink-0 text-muted-foreground hover:text-destructive'
                onClick={() => revoke(session.id)}
              >
                خروج
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
