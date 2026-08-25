/**
 * بررسی محاسبات مالی پرونده — بدون وابستگی به Vitest
 * اجرا: node scripts/verify-cases-finance.mjs
 */

function getTotalFee(caseItem) {
  return caseItem.fee?.amount ?? 0
}

function getTotalPaid(caseItem) {
  return caseItem.payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
}

function getTotalExpenses(caseItem) {
  return caseItem.expenses.reduce((sum, e) => sum + e.amount, 0)
}

function getPaymentStatus(caseItem) {
  const totalFee = getTotalFee(caseItem)
  const totalPaid = getTotalPaid(caseItem)
  if (totalFee <= 0) return totalPaid > 0 ? 'paid' : 'unpaid'
  if (totalPaid <= 0) return 'unpaid'
  if (totalPaid >= totalFee) return 'paid'
  return 'partial'
}

function summary(caseItem) {
  const totalFee = getTotalFee(caseItem)
  const totalPaid = getTotalPaid(caseItem)
  return {
    totalFee,
    totalPaid,
    remaining: Math.max(0, totalFee - totalPaid),
    totalExpenses: getTotalExpenses(caseItem),
    paymentStatus: getPaymentStatus(caseItem),
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

const now = new Date().toISOString()
const base = {
  fee: null,
  payments: [],
  expenses: [],
}

// Scenario: unpaid
{
  const s = summary({
    ...base,
    fee: { amount: 120_000_000 },
  })
  assert(s.paymentStatus === 'unpaid', 'expected unpaid')
  assert(s.remaining === 120_000_000, 'expected full remaining')
}

// Scenario: partial
{
  const s = summary({
    ...base,
    fee: { amount: 100 },
    payments: [{ amount: 40, status: 'completed' }],
  })
  assert(s.paymentStatus === 'partial', 'expected partial')
  assert(s.remaining === 60, 'expected remaining 60')
}

// Scenario: paid
{
  const s = summary({
    ...base,
    fee: { amount: 100 },
    payments: [{ amount: 100, status: 'completed' }],
  })
  assert(s.paymentStatus === 'paid', 'expected paid')
  assert(s.remaining === 0, 'expected remaining 0')
}

// Scenario: pending payment ignored
{
  const s = summary({
    ...base,
    fee: { amount: 100 },
    payments: [{ amount: 100, status: 'pending' }],
  })
  assert(s.totalPaid === 0, 'pending should not count')
  assert(s.paymentStatus === 'unpaid', 'pending should stay unpaid')
}

// Scenario: expenses independent of remaining
{
  const s = summary({
    ...base,
    fee: { amount: 100 },
    payments: [{ amount: 50, status: 'completed' }],
    expenses: [{ amount: 20 }, { amount: 5 }],
  })
  assert(s.totalExpenses === 25, 'expenses sum')
  assert(s.remaining === 50, 'expenses must not change remaining')
  assert(s.paymentStatus === 'partial', 'still partial')
}

// Scenario: overpay clamps remaining at 0 and paid status
{
  const s = summary({
    ...base,
    fee: { amount: 100 },
    payments: [{ amount: 150, status: 'completed' }],
  })
  assert(s.remaining === 0, 'remaining clamp')
  assert(s.paymentStatus === 'paid', 'overpay is paid')
}

console.log('verify-cases-finance: all scenarios passed')
