'use client'

import type { ReactNode } from 'react'
import { useTrackToggle } from '@livekit/components-react'
import { Track } from 'livekit-client'
import {
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Video,
  VideoOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type CallControlBarProps = {
  onLeave: () => void
  className?: string
}

function ControlButton({
  label,
  active,
  danger,
  onClick,
  disabled,
  children,
}: {
  label: string
  active?: boolean
  danger?: boolean
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type='button'
          size='icon'
          variant={danger ? 'destructive' : active ? 'secondary' : 'outline'}
          disabled={disabled}
          onClick={onClick}
          className={cn(
            'size-12 rounded-full border shadow-sm',
            !danger && active && 'border-primary/30 bg-primary/15 text-primary',
            !danger &&
              !active &&
              'border-border/60 bg-card/90 backdrop-blur-sm hover:bg-accent'
          )}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side='top'>{label}</TooltipContent>
    </Tooltip>
  )
}

export function CallControlBar({ onLeave, className }: CallControlBarProps) {
  const mic = useTrackToggle({ source: Track.Source.Microphone })
  const camera = useTrackToggle({ source: Track.Source.Camera })
  const screen = useTrackToggle({ source: Track.Source.ScreenShare })

  return (
    <div
      className={cn(
        'video-call-controls flex shrink-0 items-center justify-center gap-3 border-t border-border/60 bg-card/80 px-4 py-4 backdrop-blur-md sm:gap-4',
        'pb-[max(1rem,env(safe-area-inset-bottom))]',
        className
      )}
    >
      <ControlButton
        label={mic.enabled ? 'قطع میکروفون' : 'روشن کردن میکروفون'}
        active={mic.enabled}
        onClick={() => void mic.toggle()}
        disabled={mic.pending}
      >
        {mic.enabled ? <Mic className='size-5' /> : <MicOff className='size-5' />}
      </ControlButton>

      <ControlButton
        label={camera.enabled ? 'قطع دوربین' : 'روشن کردن دوربین'}
        active={camera.enabled}
        onClick={() => void camera.toggle()}
        disabled={camera.pending}
      >
        {camera.enabled ? (
          <Video className='size-5' />
        ) : (
          <VideoOff className='size-5' />
        )}
      </ControlButton>

      <ControlButton
        label={screen.enabled ? 'توقف اشتراک‌گذاری' : 'اشتراک‌گذاری صفحه'}
        active={screen.enabled}
        onClick={() => void screen.toggle()}
        disabled={screen.pending}
      >
        <MonitorUp className='size-5' />
      </ControlButton>

      <div className='mx-1 hidden h-8 w-px bg-border sm:block' aria-hidden />

      <ControlButton label='خروج از جلسه' danger onClick={onLeave}>
        <PhoneOff className='size-5' />
      </ControlButton>
    </div>
  )
}
