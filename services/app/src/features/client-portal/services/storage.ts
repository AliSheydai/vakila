/**
 * لایهٔ مشترک خواندن/نوشتن localStorage برای پنل موکل.
 * Componentها نباید مستقیماً به localStorage دسترسی داشته باشند.
 */

const STORAGE_PREFIX = 'vakila:client:v1'

export type StorageResource = 'portal'

function buildKey(clientId: string, resource: StorageResource): string {
  return `${STORAGE_PREFIX}:${clientId}:${resource}`
}

export type StorageReadResult<T> =
  | { ok: true; data: T; empty: boolean }
  | { ok: false; error: string; data: T }

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readJson<T>(
  clientId: string,
  resource: StorageResource,
  fallback: T
): StorageReadResult<T> {
  if (!clientId) {
    return { ok: false, error: 'شناسه موکل خالی است.', data: fallback }
  }

  if (!isBrowser()) {
    return { ok: true, data: fallback, empty: true }
  }

  try {
    const raw = window.localStorage.getItem(buildKey(clientId, resource))
    if (raw === null || raw === '') {
      return { ok: true, data: fallback, empty: true }
    }

    const parsed: unknown = JSON.parse(raw)
    return { ok: true, data: parsed as T, empty: false }
  } catch {
    return {
      ok: false,
      error: 'داده‌های ذخیره‌شده آسیب دیده یا قابل خواندن نیستند.',
      data: fallback,
    }
  }
}

export function writeJson<T>(
  clientId: string,
  resource: StorageResource,
  data: T
): { ok: true } | { ok: false; error: string } {
  if (!clientId) {
    return { ok: false, error: 'شناسه موکل خالی است.' }
  }

  if (!isBrowser()) {
    return { ok: false, error: 'محیط مرورگر در دسترس نیست.' }
  }

  try {
    window.localStorage.setItem(
      buildKey(clientId, resource),
      JSON.stringify(data)
    )
    return { ok: true }
  } catch {
    return {
      ok: false,
      error: 'ذخیره‌سازی انجام نشد. ممکن است فضای مرورگر پر باشد.',
    }
  }
}
