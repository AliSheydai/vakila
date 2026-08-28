import {
  portalDataSchema,
  type CaseDocument,
  type ClientCase,
  type LegalArea,
  type PortalData,
  type ServiceResult,
} from '../types'
import { buildDemoPortalData, DEMO_LAWYER_KARIMI } from '../utils/seed'
import { createId, nowIso } from '../utils/id'
import { htmlToPlainText, plainTextToHtml } from '../utils/html'
import * as storage from './storage'

const emptyPortal = (): PortalData => ({
  profile: {
    id: '',
    name: '',
    phone: '',
  },
  lawyers: [],
  cases: [],
  sessions: [],
  payments: [],
})

/** نرمال‌سازی دادهٔ قدیمی localStorage قبل از parse. */
function normalizePortalRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const data = raw as Record<string, unknown>
  if (!Array.isArray(data.cases)) return raw

  return {
    ...data,
    cases: data.cases.map((item) => {
      if (!item || typeof item !== 'object') return item
      const c = item as Record<string, unknown>
      const description =
        typeof c.description === 'string' ? c.description : ''
      const descriptionHtml =
        typeof c.descriptionHtml === 'string' && c.descriptionHtml
          ? c.descriptionHtml
          : plainTextToHtml(description)

      return {
        ...c,
        description,
        descriptionHtml,
        createdBy: c.createdBy === 'client' ? 'client' : 'lawyer',
        lawyerSynced:
          typeof c.lawyerSynced === 'boolean' ? c.lawyerSynced : true,
        comments: Array.isArray(c.comments) ? c.comments : [],
        documents: Array.isArray(c.documents) ? c.documents : [],
        timeline: Array.isArray(c.timeline) ? c.timeline : [],
      }
    }),
  }
}

export function loadPortal(clientId: string): ServiceResult<PortalData> & {
  empty?: boolean
} {
  const result = storage.readJson(clientId, 'portal', emptyPortal())
  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  if (result.empty) {
    return { ok: true, data: emptyPortal(), empty: true }
  }

  const parsed = portalDataSchema.safeParse(normalizePortalRaw(result.data))
  if (!parsed.success) {
    return {
      ok: false,
      error: 'ساختار داده‌های پنل موکل نامعتبر است.',
    }
  }

  return { ok: true, data: parsed.data, empty: false }
}

export function savePortal(
  clientId: string,
  data: PortalData
): ServiceResult<PortalData> {
  const parsed = portalDataSchema.safeParse(data)
  if (!parsed.success) {
    return { ok: false, error: 'داده‌های پنل برای ذخیره نامعتبر است.' }
  }

  const write = storage.writeJson(clientId, 'portal', parsed.data)
  if (!write.ok) {
    return { ok: false, error: write.error }
  }

  return { ok: true, data: parsed.data }
}

export function seedDemoIfEmpty(clientId: string): ServiceResult<PortalData> {
  const loaded = loadPortal(clientId)
  if (!loaded.ok) {
    return loaded
  }

  if (!loaded.empty && loaded.data.cases.length > 0) {
    // ذخیرهٔ اسکیمای نرمال‌شده (فیلدهای جدید مثل comments)
    const saved = savePortal(clientId, loaded.data)
    return saved.ok ? saved : { ok: true, data: loaded.data }
  }

  const demo = buildDemoPortalData()
  return savePortal(clientId, demo)
}

export type CreateCaseInput = {
  title: string
  legalArea: LegalArea
  descriptionHtml?: string
  documents?: Omit<CaseDocument, 'id' | 'uploadedAt' | 'status'>[]
  lawyerId?: string
}

export function createCase(
  clientId: string,
  input: CreateCaseInput
): ServiceResult<{ portal: PortalData; caseItem: ClientCase }> {
  const loaded = loadPortal(clientId)
  if (!loaded.ok) return loaded

  const title = input.title.trim()
  if (!title) {
    return { ok: false, error: 'عنوان پرونده الزامی است.' }
  }

  const lawyerId =
    input.lawyerId ||
    loaded.data.lawyers[0]?.id ||
    DEMO_LAWYER_KARIMI

  if (!loaded.data.lawyers.some((l) => l.id === lawyerId) && loaded.data.lawyers.length > 0) {
    return { ok: false, error: 'وکیل انتخاب‌شده معتبر نیست.' }
  }

  const timestamp = nowIso()
  const descriptionHtml = input.descriptionHtml?.trim() ?? ''
  const description = htmlToPlainText(descriptionHtml)
  const year = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
  }).format(new Date())
  const seq = String(loaded.data.cases.length + 1).padStart(4, '0')

  const documents: CaseDocument[] = (input.documents ?? []).map((doc) => ({
    id: createId('doc'),
    name: doc.name,
    mimeType: doc.mimeType,
    size: doc.size,
    uploadedAt: timestamp,
    status: 'available' as const,
  }))

  const caseItem: ClientCase = {
    id: createId('case'),
    caseNumber: `${year}-${seq}`,
    title,
    description,
    descriptionHtml,
    legalArea: input.legalArea,
    status: 'under_review',
    lawyerId,
    createdBy: 'client',
    lawyerSynced: false,
    documents,
    comments: [],
    timeline: [
      {
        id: createId('tl'),
        type: 'created',
        title: 'ایجاد پرونده',
        description: 'پرونده توسط موکل ثبت شد و در انتظار بررسی وکیل است.',
        occurredAt: timestamp,
      },
    ],
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const next: PortalData = {
    ...loaded.data,
    cases: [caseItem, ...loaded.data.cases],
  }

  const saved = savePortal(clientId, next)
  if (!saved.ok) return saved

  return { ok: true, data: { portal: saved.data, caseItem } }
}

export type AddCaseCommentInput = {
  bodyHtml: string
  attachments?: Omit<CaseDocument, 'id' | 'uploadedAt' | 'status'>[]
}

export function addCaseComment(
  clientId: string,
  caseId: string,
  input: AddCaseCommentInput
): ServiceResult<PortalData> {
  const loaded = loadPortal(clientId)
  if (!loaded.ok) return loaded

  const caseItem = loaded.data.cases.find((item) => item.id === caseId)
  if (!caseItem) {
    return { ok: false, error: 'پرونده یافت نشد.' }
  }

  const bodyHtml = input.bodyHtml.trim()
  const plain = htmlToPlainText(bodyHtml)
  const attachmentsMeta = input.attachments ?? []
  if (!plain && attachmentsMeta.length === 0) {
    return { ok: false, error: 'متن پیام یا پیوست الزامی است.' }
  }

  const timestamp = nowIso()
  const attachments: CaseDocument[] = attachmentsMeta.map((doc) => ({
    id: createId('doc'),
    name: doc.name,
    mimeType: doc.mimeType,
    size: doc.size,
    uploadedAt: timestamp,
    status: 'available' as const,
  }))

  const next: PortalData = {
    ...loaded.data,
    cases: loaded.data.cases.map((item) => {
      if (item.id !== caseId) return item

      const mergedDocs =
        attachments.length > 0
          ? [...attachments, ...item.documents]
          : item.documents

      return {
        ...item,
        comments: [
          ...item.comments,
          {
            id: createId('cmt'),
            authorRole: 'client' as const,
            authorName: loaded.data.profile.name || 'موکل',
            bodyHtml: bodyHtml || '<p></p>',
            attachments,
            createdAt: timestamp,
          },
        ],
        documents: mergedDocs,
        timeline:
          attachments.length > 0
            ? [
                {
                  id: createId('tl'),
                  type: 'document' as const,
                  title: 'ارسال مدرک',
                  description: `${attachments.length.toLocaleString('fa-IR')} فایل همراه پیام بارگذاری شد.`,
                  occurredAt: timestamp,
                },
                {
                  id: createId('tl'),
                  type: 'note' as const,
                  title: 'پیام جدید',
                  description: 'موکل پیام جدیدی در گفتگوی پرونده ثبت کرد.',
                  occurredAt: timestamp,
                },
                ...item.timeline,
              ]
            : [
                {
                  id: createId('tl'),
                  type: 'note' as const,
                  title: 'پیام جدید',
                  description: 'موکل پیام جدیدی در گفتگوی پرونده ثبت کرد.',
                  occurredAt: timestamp,
                },
                ...item.timeline,
              ],
        updatedAt: timestamp,
      }
    }),
  }

  return savePortal(clientId, next)
}

export type AddCaseDocumentInput = Omit<
  CaseDocument,
  'id' | 'uploadedAt' | 'status'
>

export function addCaseDocument(
  clientId: string,
  caseId: string,
  input: AddCaseDocumentInput
): ServiceResult<{ portal: PortalData; document: CaseDocument }> {
  const loaded = loadPortal(clientId)
  if (!loaded.ok) return loaded

  const caseItem = loaded.data.cases.find((item) => item.id === caseId)
  if (!caseItem) {
    return { ok: false, error: 'پرونده یافت نشد.' }
  }

  const timestamp = nowIso()
  const document: CaseDocument = {
    id: createId('doc'),
    name: input.name,
    mimeType: input.mimeType,
    size: input.size,
    uploadedAt: timestamp,
    status: 'available',
  }

  const next: PortalData = {
    ...loaded.data,
    cases: loaded.data.cases.map((item) =>
      item.id === caseId
        ? {
            ...item,
            documents: [document, ...item.documents],
            timeline: [
              {
                id: createId('tl'),
                type: 'document' as const,
                title: 'بارگذاری مدرک',
                description: `فایل «${document.name}» توسط موکل بارگذاری شد.`,
                occurredAt: timestamp,
              },
              ...item.timeline,
            ],
            updatedAt: timestamp,
          }
        : item
    ),
  }

  const saved = savePortal(clientId, next)
  if (!saved.ok) return saved

  return { ok: true, data: { portal: saved.data, document } }
}

export function cancelSession(
  clientId: string,
  sessionId: string
): ServiceResult<PortalData> {
  const loaded = loadPortal(clientId)
  if (!loaded.ok) return loaded

  const session = loaded.data.sessions.find((item) => item.id === sessionId)
  if (!session) {
    return { ok: false, error: 'جلسه یافت نشد.' }
  }
  if (!session.canCancel) {
    return { ok: false, error: 'لغو این جلسه مجاز نیست.' }
  }
  if (session.status === 'cancelled' || session.status === 'completed') {
    return { ok: false, error: 'وضعیت جلسه قابل تغییر نیست.' }
  }

  const timestamp = nowIso()
  const next: PortalData = {
    ...loaded.data,
    sessions: loaded.data.sessions.map((item) =>
      item.id === sessionId
        ? {
            ...item,
            status: 'cancelled' as const,
            canCancel: false,
            canReschedule: false,
            updatedAt: timestamp,
          }
        : item
    ),
  }

  return savePortal(clientId, next)
}

export function retryPayment(
  clientId: string,
  paymentId: string
): ServiceResult<PortalData> {
  const loaded = loadPortal(clientId)
  if (!loaded.ok) return loaded

  const payment = loaded.data.payments.find((item) => item.id === paymentId)
  if (!payment) {
    return { ok: false, error: 'پرداخت یافت نشد.' }
  }
  if (payment.status !== 'failed' && payment.status !== 'pending') {
    return { ok: false, error: 'این پرداخت قابل تلاش مجدد نیست.' }
  }

  const timestamp = nowIso()
  const next: PortalData = {
    ...loaded.data,
    payments: loaded.data.payments.map((item) =>
      item.id === paymentId
        ? {
            ...item,
            status: 'completed' as const,
            method: 'online' as const,
            transactionId: `TRX-${Date.now()}`,
            paidAt: timestamp,
            updatedAt: timestamp,
            description:
              item.description ??
              'پرداخت با موفقیت از طریق درگاه آنلاین انجام شد.',
          }
        : item
    ),
  }

  return savePortal(clientId, next)
}
