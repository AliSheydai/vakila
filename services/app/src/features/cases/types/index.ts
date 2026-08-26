import { z } from 'zod'

/** وضعیت‌های پرونده — قابل توسعه */
export const CASE_STATUSES = [
  'new',
  'under_review',
  'active',
  'awaiting_action',
  'closed',
  'archived',
] as const

export type CaseStatus = (typeof CASE_STATUSES)[number]

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  new: 'جدید',
  under_review: 'در حال بررسی',
  active: 'فعال',
  awaiting_action: 'در انتظار اقدام',
  closed: 'بسته‌شده',
  archived: 'بایگانی‌شده',
}

/** حوزه‌های حقوقی اولیه */
export const LEGAL_AREAS = [
  'civil',
  'criminal',
  'family',
  'commercial',
  'labor',
  'administrative',
  'other',
] as const

export type LegalArea = (typeof LEGAL_AREAS)[number]

export const LEGAL_AREA_LABELS: Record<LegalArea, string> = {
  civil: 'حقوقی',
  criminal: 'کیفری',
  family: 'خانواده',
  commercial: 'تجاری',
  labor: 'کار',
  administrative: 'اداری',
  other: 'سایر',
}

export const PAYMENT_METHODS = [
  'cash',
  'card',
  'transfer',
  'cheque',
  'online',
  'other',
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'نقدی',
  card: 'کارت',
  transfer: 'انتقال بانکی',
  cheque: 'چک',
  online: 'آنلاین',
  other: 'سایر',
}

/** منبع پرداخت — آماده برای اتصال درگاه واقعی */
export const PAYMENT_SOURCES = ['manual', 'online'] as const
export type PaymentSource = (typeof PAYMENT_SOURCES)[number]

export const PAYMENT_RECORD_STATUSES = [
  'completed',
  'pending',
  'failed',
] as const
export type PaymentRecordStatus = (typeof PAYMENT_RECORD_STATUSES)[number]

export const EXPENSE_CATEGORIES = [
  'court',
  'expert',
  'travel',
  'service',
  'other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  court: 'دادرسی',
  expert: 'کارشناسی',
  travel: 'رفت‌وآمد',
  service: 'خدمات',
  other: 'سایر',
}

/** وضعیت پرداخت پرونده — محاسبه‌شده، ذخیره نمی‌شود */
export const CASE_PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'] as const
export type CasePaymentStatus = (typeof CASE_PAYMENT_STATUSES)[number]

export const CASE_PAYMENT_STATUS_LABELS: Record<CasePaymentStatus, string> = {
  unpaid: 'پرداخت نشده',
  partial: 'بخشی پرداخت شده',
  paid: 'کامل پرداخت شده',
}

export const ATTACHMENT_UPLOAD_STATUSES = [
  'uploading',
  'success',
  'failed',
] as const
export type AttachmentUploadStatus = (typeof ATTACHMENT_UPLOAD_STATUSES)[number]

// ─── Zod schemas ───────────────────────────────────────────

/**
 * فقط metadata — محتوای فایل در localStorage ذخیره نمی‌شود.
 * برای preview در جلسه فعلی می‌توان از Object URL در UI استفاده کرد.
 * همین schema برای ضمیمهٔ پرونده و ضمیمهٔ موکل استفاده می‌شود (جدا در هر موجودیت).
 */
export const attachmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().nonnegative(),
  uploadedAt: z.string().datetime(),
  uploadedBy: z.string().optional(),
})

export type Attachment = z.infer<typeof attachmentSchema>

/**
 * موکل موجودیت مستقل است (جدا از Case).
 * attachments فقط metadata است — محتوای فایل در localStorage ذخیره نمی‌شود.
 * فیلدهای جدید با default سازگار با دادهٔ قدیمی در LS هستند.
 */
export const clientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  /**
   * تابعیت برای تفسیر فیلد شناسه:
   * iranian → کد ملی ۱۰ رقمی | foreign → شناسه/گذرنامه اتباع
   * اختیاری برای سازگاری با دادهٔ قدیمی در localStorage
   */
  citizenship: z.enum(['iranian', 'foreign']).optional(),
  /** کد ملی یا شناسه اتباع — اختیاری */
  nationalId: z.string().optional(),
  /** عکس پروفایل به صورت data URL فشرده — اختیاری */
  avatarDataUrl: z.string().optional(),
  notes: z.string().optional(),
  /** ضمائم مربوط به خود شخص (نه پرونده) */
  attachments: z.array(attachmentSchema).default([]),
  ownerId: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Client = z.infer<typeof clientSchema>

export const feeSchema = z.object({
  id: z.string().min(1),
  amount: z.number().nonnegative(),
  description: z.string().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Fee = z.infer<typeof feeSchema>

export const paymentSchema = z.object({
  id: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().datetime(),
  method: z.enum(PAYMENT_METHODS),
  source: z.enum(PAYMENT_SOURCES),
  status: z.enum(PAYMENT_RECORD_STATUSES),
  description: z.string().optional(),
  /** برای اتصال آینده به تراکنش درگاه */
  externalTransactionId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Payment = z.infer<typeof paymentSchema>

export const expenseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().positive(),
  date: z.string().datetime(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Expense = z.infer<typeof expenseSchema>

export const caseSchema = z.object({
  id: z.string().min(1),
  caseNumber: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  legalArea: z.enum(LEGAL_AREAS),
  status: z.enum(CASE_STATUSES),
  /** موکل مستقل؛ فعلاً یک موکل به‌ازای هر پرونده */
  clientId: z.string().nullable(),
  ownerId: z.string().min(1),
  fee: feeSchema.nullable(),
  payments: z.array(paymentSchema).default([]),
  expenses: z.array(expenseSchema).default([]),
  attachments: z.array(attachmentSchema).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Case = z.infer<typeof caseSchema>

export const casesCollectionSchema = z.array(caseSchema)
export const clientsCollectionSchema = z.array(clientSchema)

/** ورودی‌های ایجاد/ویرایش — بدون فیلدهای سیستمی */
export type CreateClientInput = {
  name: string
  phone: string
  email?: string
  citizenship?: 'iranian' | 'foreign'
  nationalId?: string
  /** data URL؛ برای حذف در آپدیت می‌تواند null باشد */
  avatarDataUrl?: string | null
  notes?: string
}

export type UpdateClientInput = Partial<CreateClientInput>

/** فیلتر وضعیت پرونده برای لیست موکل‌ها */
export type ClientCaseActivityFilter =
  | 'all'
  | 'with_active_case'
  | 'without_active_case'

export type ClientSortOption =
  | 'newest'
  | 'oldest'
  | 'name_asc'

export type CreateCaseInput = {
  title: string
  caseNumber: string
  legalArea: LegalArea
  status?: CaseStatus
  description?: string
  clientId?: string | null
}

export type UpdateCaseInput = Partial<CreateCaseInput>

export type UpsertFeeInput = {
  amount: number
  description?: string
  dueDate?: string | null
}

export type CreatePaymentInput = {
  amount: number
  date: string
  method: PaymentMethod
  description?: string
  source?: PaymentSource
  status?: PaymentRecordStatus
  externalTransactionId?: string
}

export type CreateExpenseInput = {
  title: string
  category: ExpenseCategory
  amount: number
  date: string
  description?: string
}

export type CreateAttachmentInput = {
  name: string
  mimeType: string
  size: number
  uploadedBy?: string
}

export type CaseFinancialSummary = {
  totalFee: number
  totalPaid: number
  remaining: number
  totalExpenses: number
  paymentStatus: CasePaymentStatus
}
