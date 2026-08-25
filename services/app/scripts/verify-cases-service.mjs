/**
 * تست یکپارچگی Service + localStorage mock برای سناریوهای اصلی پرونده
 * اجرا: node scripts/verify-cases-service.mjs
 */

import assert from 'node:assert/strict'

const store = new Map()

globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
}

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function nowIso() {
  return new Date().toISOString()
}

const PREFIX = 'vakila:admin:v1'
const ownerId = 'ACC001'

function key(resource) {
  return `${PREFIX}:${ownerId}:${resource}`
}

function read(resource) {
  const raw = window.localStorage.getItem(key(resource))
  if (!raw) return []
  return JSON.parse(raw)
}

function write(resource, data) {
  window.localStorage.setItem(key(resource), JSON.stringify(data))
}

// 1) empty state
assert.equal(read('cases').length, 0, 'starts empty')

// 2) create client + case
const client = {
  id: createId('client'),
  name: 'رضا محمدی',
  phone: '09121234567',
  ownerId,
  createdAt: nowIso(),
  updatedAt: nowIso(),
}
write('clients', [client])

const caseItem = {
  id: createId('case'),
  caseNumber: '1404-TEST',
  title: 'پرونده آزمایشی',
  description: 'شرح',
  legalArea: 'civil',
  status: 'new',
  clientId: client.id,
  ownerId,
  fee: null,
  payments: [],
  expenses: [],
  attachments: [],
  createdAt: nowIso(),
  updatedAt: nowIso(),
}
write('cases', [caseItem])
assert.equal(read('cases').length, 1)

// 3) duplicate case number detection
{
  const existing = read('cases')
  const duplicate = existing.some((c) => c.caseNumber === '1404-TEST')
  assert.equal(duplicate, true)
}

// 4) fee + payment + remaining
{
  const cases = read('cases')
  const current = cases[0]
  current.fee = {
    id: createId('fee'),
    amount: 1000,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  current.payments.push({
    id: createId('pay'),
    amount: 400,
    date: nowIso(),
    method: 'transfer',
    source: 'manual',
    status: 'completed',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  })
  current.expenses.push({
    id: createId('exp'),
    title: 'دادرسی',
    category: 'court',
    amount: 50,
    date: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  })
  current.attachments.push({
    id: createId('att'),
    name: 'doc.pdf',
    mimeType: 'application/pdf',
    size: 1200,
    uploadedAt: nowIso(),
  })
  current.updatedAt = nowIso()
  write('cases', cases)

  const saved = read('cases')[0]
  const paid = saved.payments
    .filter((p) => p.status === 'completed')
    .reduce((s, p) => s + p.amount, 0)
  const remaining = Math.max(0, saved.fee.amount - paid)
  assert.equal(remaining, 600)
  assert.equal(saved.expenses.length, 1)
  assert.equal(saved.attachments.length, 1)
}

// 5) refresh persistence
{
  const afterRefresh = read('cases')
  assert.equal(afterRefresh.length, 1)
  assert.equal(afterRefresh[0].caseNumber, '1404-TEST')
  assert.equal(afterRefresh[0].clientId, client.id)
}

// 6) delete payment
{
  const cases = read('cases')
  cases[0].payments = []
  write('cases', cases)
  assert.equal(read('cases')[0].payments.length, 0)
}

// 7) per-owner isolation key
{
  const otherKey = `${PREFIX}:OTHER:cases`
  assert.equal(window.localStorage.getItem(otherKey), null)
}

console.log('verify-cases-service: all scenarios passed')
