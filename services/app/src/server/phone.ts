import {
  formatIranianMobileLocal,
  isValidIranianMobile as isValidIranianMobileBase,
  normalizeIranianPhone,
} from '@/lib/iranian-phone'

export { normalizeIranianPhone }

export function isValidIranianMobile(phone: string): boolean {
  return isValidIranianMobileBase(phone)
}

/** Ferzz destination: 98912… (no +). */
export function toFerzzDestination(phone: string): string {
  const normalized = normalizeIranianPhone(phone)
  const local = formatIranianMobileLocal(normalized)
  if (/^09\d{9}$/.test(local)) {
    return `98${local.slice(1)}`
  }
  const stripped = normalized.replace(/^\+/, '').replace(/^00/, '')
  if (/^989\d{9}$/.test(stripped)) return stripped
  if (/^9\d{9}$/.test(stripped)) return `98${stripped}`
  throw new Error('Invalid Iranian mobile number')
}

/** Display form: 09… */
export function toLocalDisplay(phone: string): string {
  return formatIranianMobileLocal(phone)
}
