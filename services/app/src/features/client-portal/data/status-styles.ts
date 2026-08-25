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
    'bg-sky-100/40 text-sky-900 border-sky-200 dark:bg-sky-900/30 dark:text-sky-100 dark:border-sky-800',
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
    'bg-violet-100/40 text-violet-900 border-violet-200 dark:bg-violet-900/30 dark:text-violet-100 dark:border-violet-800',
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
