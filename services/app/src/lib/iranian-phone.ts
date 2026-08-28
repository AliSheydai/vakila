/** Normalize Iranian mobile input (spaces, dashes, Persian digits). */
export function normalizeIranianPhone(value: string): string {
  return value
    .trim()
    .replace(/[\s\-_.]/g, '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

/**
 * Valid Iranian mobile formats:
 * 09xxxxxxxxx | 9xxxxxxxxx | +989xxxxxxxxx | 00989xxxxxxxxx | 989xxxxxxxxx
 */
const IRANIAN_MOBILE_REGEX = /^(?:0|98|\+98|0098)?9\d{9}$/

export function isValidIranianMobile(value: string): boolean {
  return IRANIAN_MOBILE_REGEX.test(normalizeIranianPhone(value))
}

/** Format to local 09xxxxxxxxx when possible. */
export function formatIranianMobileLocal(value: string): string {
  const normalized = normalizeIranianPhone(value)
  const digits = normalized.replace(/^\+?0*98/, '0').replace(/^9/, '09')
  if (/^09\d{9}$/.test(digits)) return digits
  return normalized
}

/** Strip country/leading zero for +98 input field (9xxxxxxxxx, max 10 digits). */
export function toIranianMobileInputDigits(value: string): string {
  let digits = normalizeIranianPhone(value).replace(/\D/g, '')
  if (digits.startsWith('98')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = digits.slice(1)
  return digits.slice(0, 10)
}

/** Format +98 field digits as 912 345 6789 */
export function formatIranianMobileInputDisplay(value: string): string {
  const digits = toIranianMobileInputDigits(value)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
}

/** Convert +98 field input to local 09… form for validation/API. */
export function fromIranianMobileInputDigits(value: string): string {
  const digits = toIranianMobileInputDigits(value)
  if (!digits) return ''
  return digits.startsWith('9') ? `0${digits}` : digits
}
