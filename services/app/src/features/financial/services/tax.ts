import type { TaxConfig } from '../types'

/** Central tax config for the Financial module — do not hardcode rate in UI. */
export const DEFAULT_TAX_CONFIG: TaxConfig = {
  rate: 0.09,
  label: 'مالیات محاسبه‌شده با نرخ ۹٪',
}

/**
 * Tax applies only to completed payments.
 * Expenses have no tax in this phase.
 */
export function calculatePaymentTax(
  amount: number,
  isCompleted: boolean,
  config: TaxConfig = DEFAULT_TAX_CONFIG
): { taxAmount: number; netAmount: number } {
  if (!isCompleted || amount <= 0 || config.rate <= 0) {
    return { taxAmount: 0, netAmount: amount }
  }

  const taxAmount = roundMoney(amount * config.rate)
  const netAmount = roundMoney(amount - taxAmount)
  return { taxAmount, netAmount }
}

export function roundMoney(value: number): number {
  return Math.round(value)
}
