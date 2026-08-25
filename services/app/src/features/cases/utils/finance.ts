import type {
  Case,
  CaseFinancialSummary,
  CasePaymentStatus,
  Payment,
} from '../types'

function isCompletedPayment(payment: Payment): boolean {
  return payment.status === 'completed'
}

export function getTotalFee(caseItem: Case): number {
  return caseItem.fee?.amount ?? 0
}

export function getTotalPaid(caseItem: Case): number {
  return caseItem.payments
    .filter(isCompletedPayment)
    .reduce((sum, payment) => sum + payment.amount, 0)
}

export function getTotalExpenses(caseItem: Case): number {
  return caseItem.expenses.reduce((sum, expense) => sum + expense.amount, 0)
}

export function getRemaining(caseItem: Case): number {
  return Math.max(0, getTotalFee(caseItem) - getTotalPaid(caseItem))
}

export function getPaymentStatus(caseItem: Case): CasePaymentStatus {
  const totalFee = getTotalFee(caseItem)
  const totalPaid = getTotalPaid(caseItem)

  if (totalFee <= 0) {
    return totalPaid > 0 ? 'paid' : 'unpaid'
  }

  if (totalPaid <= 0) return 'unpaid'
  if (totalPaid >= totalFee) return 'paid'
  return 'partial'
}

export function getCaseFinancialSummary(caseItem: Case): CaseFinancialSummary {
  const totalFee = getTotalFee(caseItem)
  const totalPaid = getTotalPaid(caseItem)
  const totalExpenses = getTotalExpenses(caseItem)

  return {
    totalFee,
    totalPaid,
    remaining: Math.max(0, totalFee - totalPaid),
    totalExpenses,
    paymentStatus: getPaymentStatus(caseItem),
  }
}
