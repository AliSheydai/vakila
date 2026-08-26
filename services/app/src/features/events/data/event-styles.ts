import type { EventType } from '../types'

/** رنگ‌های محدود برای نوع رویداد — فقط تمایز ضروری */
export const eventTypeStyles = new Map<EventType, string>([
  [
    'client_meeting',
    'border-transparent bg-sky-100/70 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100',
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
    'border-transparent bg-neutral-200/70 text-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-100',
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
    'bg-sky-500/15 text-sky-950 ring-sky-500/20 dark:text-sky-50',
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
    'bg-neutral-500/15 text-neutral-900 ring-neutral-500/20 dark:text-neutral-50',
  ],
  [
    'other',
    'bg-muted text-foreground ring-border',
  ],
])
