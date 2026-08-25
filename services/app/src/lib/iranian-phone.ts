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
