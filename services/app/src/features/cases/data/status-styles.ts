import type { CaseStatus } from '../types'

/** کلاس‌های Badge وضعیت پرونده */
export const caseStatusStyles = new Map<CaseStatus, string>([
  [
    'new',
    'bg-sky-100/40 text-sky-900 border-sky-200 dark:bg-sky-900/30 dark:text-sky-100 dark:border-sky-800',
  ],
  [
    'under_review',
    'bg-amber-100/40 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800',
  ],
  [
    'active',
    'bg-teal-100/40 text-teal-900 border-teal-200 dark:bg-teal-900/30 dark:text-teal-100 dark:border-teal-800',
  ],
  [
    'awaiting_action',
    'bg-orange-100/40 text-orange-900 border-orange-200 dark:bg-orange-900/30 dark:text-orange-100 dark:border-orange-800',
  ],
  [
    'closed',
    'bg-neutral-200/50 text-neutral-800 border-neutral-300 dark:bg-neutral-800/50 dark:text-neutral-100 dark:border-neutral-700',
  ],
  [
    'archived',
    'bg-violet-100/40 text-violet-900 border-violet-200 dark:bg-violet-900/30 dark:text-violet-100 dark:border-violet-800',
  ],
])
