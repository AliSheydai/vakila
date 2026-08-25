import { portalDataSchema, type PortalData, type ServiceResult } from '../types'
import { buildDemoPortalData } from '../utils/seed'
import { nowIso } from '../utils/id'
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

  const parsed = portalDataSchema.safeParse(result.data)
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
    return { ok: true, data: loaded.data }
  }

  const demo = buildDemoPortalData()
  return savePortal(clientId, demo)
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
