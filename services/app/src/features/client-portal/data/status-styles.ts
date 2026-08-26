import type {
  ClientCaseStatus,
  DocumentStatus,
  PaymentStatus,
  SessionStatus,
} from '../types'

export const caseStatusStyles = new Map<ClientCaseStatus, string>([
  [
    'active',
    'bg-teal-100/40 text-teal-900 border-teal-200 dark:bg-teal-900/30 dark:text-teal-100 dark:border-teal-800',
  ],
  [
    'under_review',
    'bg-amber-100/40 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800',
  ],
  [
    'closed',
    'bg-neutral-200/50 text-neutral-800 border-neutral-300 dark:bg-neutral-800/50 dark:text-neutral-100 dark:border-neutral-700',
  ],
  [
    'cancelled',
    'bg-rose-100/40 text-rose-900 border-rose-200 dark:bg-rose-900/30 dark:text-rose-100 dark:border-rose-800',
  ],
])

export const sessionStatusStyles = new Map<SessionStatus, string>([
  [
    'scheduled',
    'bg-[#1a4654]/10 text-[#0e2c38] border-[#1a4654]/25 dark:bg-[#143642]/40 dark:text-[#a8c0c6] dark:border-[#143642]',
  ],
  [
    'confirmed',
    'bg-teal-100/40 text-teal-900 border-teal-200 dark:bg-teal-900/30 dark:text-teal-100 dark:border-teal-800',
  ],
  [
    'completed',
    'bg-neutral-200/50 text-neutral-800 border-neutral-300 dark:bg-neutral-800/50 dark:text-neutral-100 dark:border-neutral-700',
  ],
  [
    'cancelled',
    'bg-rose-100/40 text-rose-900 border-rose-200 dark:bg-rose-900/30 dark:text-rose-100 dark:border-rose-800',
  ],
  [
    'no_show',
    'bg-orange-100/40 text-orange-900 border-orange-200 dark:bg-orange-900/30 dark:text-orange-100 dark:border-orange-800',
  ],
])

export const paymentStatusStyles = new Map<PaymentStatus, string>([
  [
    'completed',
    'bg-teal-100/40 text-teal-900 border-teal-200 dark:bg-teal-900/30 dark:text-teal-100 dark:border-teal-800',
  ],
  [
    'pending',
    'bg-amber-100/40 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800',
  ],
  [
    'failed',
    'bg-rose-100/40 text-rose-900 border-rose-200 dark:bg-rose-900/30 dark:text-rose-100 dark:border-rose-800',
  ],
  [
    'cancelled',
    'bg-neutral-200/50 text-neutral-800 border-neutral-300 dark:bg-neutral-800/50 dark:text-neutral-100 dark:border-neutral-700',
  ],
  [
    'refunded',
    'bg-[#c9a25a]/15 text-[#102028] border-[#c9a25a]/35 dark:bg-[#d4b06a]/20 dark:text-[#e8c87a] dark:border-[#d4b06a]/40',
  ],
])

export const documentStatusStyles = new Map<DocumentStatus, string>([
  [
    'available',
    'bg-teal-100/40 text-teal-900 border-teal-200 dark:bg-teal-900/30 dark:text-teal-100 dark:border-teal-800',
  ],
  [
    'processing',
    'bg-amber-100/40 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800',
  ],
  [
    'restricted',
    'bg-rose-100/40 text-rose-900 border-rose-200 dark:bg-rose-900/30 dark:text-rose-100 dark:border-rose-800',
  ],
])
