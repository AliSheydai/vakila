/** تبدیل ارقام فارسی/عربی به لاتین و حذف فاصله */
export function normalizeNationalIdDigits(value: string): string {
  return value
    .trim()
    .replace(/[\s\-_.]/g, '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

/**
 * اعتبارسنجی کد ملی ایران با رقم کنترل.
 * @see الگوریتم استاندارد ۱۰ رقمی کد ملی
 */
export function isValidIranianNationalId(value: string): boolean {
  const code = normalizeNationalIdDigits(value)
  if (!/^\d{10}$/.test(code)) return false
  // همه ارقام یکسان (مثل 0000000000) نامعتبرند
  if (/^(\d)\1{9}$/.test(code)) return false

  const check = Number(code[9])
  const sum = code
    .slice(0, 9)
    .split('')
    .reduce((acc, digit, index) => acc + Number(digit) * (10 - index), 0)
  const remainder = sum % 11

  return (
    (remainder < 2 && check === remainder) ||
    (remainder >= 2 && check === 11 - remainder)
  )
}

/**
 * شناسه اتباع / گذرنامه: حروف و اعداد، طول معقول.
 * خالی بودن را caller بررسی می‌کند.
 */
export function isValidForeignId(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, '')
  if (normalized.length < 5 || normalized.length > 20) return false
  return /^[A-Za-z0-9\-/]+$/.test(normalized)
}

export function normalizeForeignId(value: string): string {
  return value.trim().replace(/\s+/g, '').toUpperCase()
}
