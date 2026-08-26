/**
 * لایهٔ مشترک خواندن/نوشتن localStorage برای ماژول پرونده‌ها.
 * Componentها نباید مستقیماً به localStorage دسترسی داشته باشند.
 */

const STORAGE_PREFIX = 'vakila:admin:v1'

export type StorageResource = 'cases' | 'clients' | 'events' | 'meta'

function buildKey(ownerId: string, resource: StorageResource): string {
  return `${STORAGE_PREFIX}:${ownerId}:${resource}`
}

export type StorageReadResult<T> =
  | { ok: true; data: T; empty: boolean }
  | { ok: false; error: string; data: T }

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readJson<T>(
  ownerId: string,
  resource: StorageResource,
  fallback: T
): StorageReadResult<T> {
  if (!ownerId) {
    return { ok: false, error: 'ownerId خالی است.', data: fallback }
  }

  if (!isBrowser()) {
    return { ok: true, data: fallback, empty: true }
  }

  try {
    const raw = window.localStorage.getItem(buildKey(ownerId, resource))
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
  ownerId: string,
  resource: StorageResource,
  data: T
): { ok: true } | { ok: false; error: string } {
  if (!ownerId) {
    return { ok: false, error: 'ownerId خالی است.' }
  }

  if (!isBrowser()) {
    return { ok: false, error: 'محیط مرورگر در دسترس نیست.' }
  }

  try {
    window.localStorage.setItem(buildKey(ownerId, resource), JSON.stringify(data))
    return { ok: true }
  } catch {
    return {
      ok: false,
      error: 'ذخیره‌سازی انجام نشد. ممکن است فضای مرورگر پر باشد.',
    }
  }
}

export function removeResource(
  ownerId: string,
  resource: StorageResource
): void {
  if (!isBrowser() || !ownerId) return
  window.localStorage.removeItem(buildKey(ownerId, resource))
}

export function getStorageKey(
  ownerId: string,
  resource: StorageResource
): string {
  return buildKey(ownerId, resource)
}
