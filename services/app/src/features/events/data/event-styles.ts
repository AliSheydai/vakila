import type { EventType } from '../types'

/** رنگ‌های محدود برای نوع رویداد — پالت ink/mist/brass */
export const eventTypeStyles = new Map<EventType, string>([
  [
    'client_meeting',
    'border-transparent bg-[#1a4654]/12 text-[#0e2c38] dark:bg-[#143642]/45 dark:text-[#a8c0c6]',
  ],
  [
    'court_hearing',
    'border-transparent bg-amber-100/80 text-amber-950 dark:bg-amber-900/45 dark:text-amber-50',
  ],
  [
    'online_meeting',
    'border-transparent bg-teal-100/70 text-teal-900 dark:bg-teal-900/40 dark:text-teal-100',
  ],
  [
    'legal_deadline',
    'border-transparent bg-rose-100/80 text-rose-950 dark:bg-rose-900/45 dark:text-rose-50',
  ],
  [
    'reminder',
    'border-transparent bg-[#c9a25a]/18 text-[#102028] dark:bg-[#d4b06a]/25 dark:text-[#e8c87a]',
  ],
  [
    'other',
    'border-transparent bg-muted text-muted-foreground',
  ],
])

/** پس‌زمینهٔ بلوک رویداد روی تقویم */
export const eventBlockStyles = new Map<EventType, string>([
  [
    'client_meeting',
    'bg-[#1a4654]/15 text-[#06141c] ring-[#1a4654]/25 dark:text-[#a8c0c6]',
  ],
  [
    'court_hearing',
    'bg-amber-500/20 text-amber-950 ring-amber-500/25 dark:text-amber-50',
  ],
  [
    'online_meeting',
    'bg-teal-500/15 text-teal-950 ring-teal-500/20 dark:text-teal-50',
  ],
  [
    'legal_deadline',
    'bg-rose-500/20 text-rose-950 ring-rose-500/30 dark:text-rose-50',
  ],
  [
    'reminder',
    'bg-[#c9a25a]/20 text-[#102028] ring-[#c9a25a]/30 dark:text-[#e8c87a]',
  ],
  [
    'other',
    'bg-muted text-foreground ring-border',
  ],
])
