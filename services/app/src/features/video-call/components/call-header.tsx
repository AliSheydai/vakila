'use client'

import { useConnectionState } from '@livekit/components-react'
import { ConnectionState } from 'livekit-client'
import { Loader2, Signal, Users, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type CallHeaderProps = {
  eventTitle: string
  participantCount: number
  role: 'host' | 'client'
  className?: string
}

const CONNECTION_LABELS: Record<ConnectionState, string> = {
  [ConnectionState.Connected]: 'متصل',
  [ConnectionState.Connecting]: 'در حال اتصال',
  [ConnectionState.Reconnecting]: 'اتصال مجدد',
  [ConnectionState.Disconnected]: 'قطع شده',
  [ConnectionState.SignalReconnecting]: 'اتصال مجدد سیگنال',
}

export function CallHeader({
  eventTitle,
  participantCount,
  role,
  className,
}: CallHeaderProps) {
  const connectionState = useConnectionState()
  const isConnected = connectionState === ConnectionState.Connected
  const isBusy =
    connectionState === ConnectionState.Connecting ||
    connectionState === ConnectionState.Reconnecting ||
    connectionState === ConnectionState.SignalReconnecting

  return (
    <header
      className={cn(
        'video-call-header flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-card/90 px-4 py-3 backdrop-blur-md sm:px-5',
        className
      )}
    >
      <div className='min-w-0 flex-1 text-start'>
        <div className='mb-1 flex flex-wrap items-center gap-2'>
          <Badge
            variant='outline'
            className='border-primary/25 bg-primary/10 text-primary'
          >
            <Video className='size-3' />
            جلسه آنلاین
          </Badge>
          <Badge variant='secondary' className='text-muted-foreground'>
            {role === 'host' ? 'نقش: وکیل' : 'نقش: موکل'}
          </Badge>
        </div>
        <h1 className='truncate text-base font-semibold tracking-tight sm:text-lg'>
          {eventTitle}
        </h1>
      </div>

      <div className='flex shrink-0 flex-col items-end gap-1.5 text-xs text-muted-foreground'>
        <div className='flex items-center gap-2'>
          <span className='inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2 py-1'>
            <Users className='size-3.5' />
            {participantCount} نفر
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-1',
              isConnected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : isBusy
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'border-border/60 bg-background/80'
            )}
          >
            {isBusy ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : (
              <Signal className='size-3.5' />
            )}
            {CONNECTION_LABELS[connectionState] ?? 'نامشخص'}
          </span>
        </div>
      </div>
    </header>
  )
}
