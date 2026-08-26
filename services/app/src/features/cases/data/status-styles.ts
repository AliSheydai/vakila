import type { CaseStatus } from '../types'

/** کلاس‌های Badge وضعیت پرونده — پالت ink/mist/brass */
export const caseStatusStyles = new Map<CaseStatus, string>([
  [
    'new',
    'bg-[#1a4654]/10 text-[#0e2c38] border-[#1a4654]/25 dark:bg-[#143642]/40 dark:text-[#a8c0c6] dark:border-[#143642]',
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
    'bg-[#c9a25a]/15 text-[#102028] border-[#c9a25a]/35 dark:bg-[#d4b06a]/20 dark:text-[#e8c87a] dark:border-[#d4b06a]/40',
  ],
  [
    'closed',
    'bg-neutral-200/50 text-neutral-800 border-neutral-300 dark:bg-neutral-800/50 dark:text-neutral-100 dark:border-neutral-700',
  ],
  [
    'archived',
    'bg-[#06141c]/08 text-[#06141c]/80 border-[#06141c]/15 dark:bg-[#e8efe8]/08 dark:text-[#a8c0c6] dark:border-[#e8efe8]/15',
  ],
])
