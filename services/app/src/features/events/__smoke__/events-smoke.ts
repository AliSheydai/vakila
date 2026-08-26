/**
 * Smoke test for Phase 4.2 events data layer (Node + mock localStorage).
 * Run: npx tsx src/features/events/__smoke__/events-smoke.ts
 */

import { readJson, writeJson, removeResource } from '../../cases/services/storage'
import * as eventsService from '../services/events-service'
import {
  combineDateAndTime,
  getTemporalStatus,
  toDateKey,
} from '../utils/datetime'
import {
  filterEvents,
  getTodayEvents,
  summarizeEvents,
} from '../utils/filters'
import { buildDemoEvents } from '../utils/seed'
import type { Event } from '../types'

const OWNER = 'ACC001_SMOKE'

type Store = Map<string, string>

function installMockLocalStorage(): Store {
  const store: Store = new Map()
  const localStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
  }
  ;(globalThis as unknown as { window: { localStorage: typeof localStorage } }).window =
    { localStorage }
  ;(globalThis as unknown as { localStorage: typeof localStorage }).localStorage =
    localStorage
  return store
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

function run() {
  const store = installMockLocalStorage()
  removeResource(OWNER, 'events')

  // empty list
  const empty = eventsService.listEvents(OWNER)
  assert(empty.ok && empty.data.length === 0, 'empty list failed')

  // create validation
  const badEnd = eventsService.createEvent(OWNER, {
    title: 'تست',
    type: 'reminder',
    date: '2026-08-26',
    startTime: '12:00',
    endTime: '11:00',
  })
  assert(!badEnd.ok, 'end-before-start should fail')

  const created = eventsService.createEvent(OWNER, {
    title: 'جلسه تست',
    type: 'client_meeting',
    date: toDateKey(new Date()),
    startTime: '10:00',
    endTime: '11:00',
    clientId: 'client_1',
    caseId: 'case_1',
  })
  assert(created.ok, 'create should succeed')
  if (!created.ok) return

  // persist key
  const key = `vakila:admin:v1:${OWNER}:events`
  assert(store.has(key), 'events key missing in storage')

  // update
  const updated = eventsService.updateEvent(OWNER, created.data.id, {
    title: 'جلسه ویرایش‌شده',
    location: 'دفتر',
  })
  assert(updated.ok && updated.data.title === 'جلسه ویرایش‌شده', 'update failed')

  // seed helpers
  const demo = buildDemoEvents(OWNER, { cases: [], clients: [] })
  assert(demo.length === 5, 'demo seed count')
  const temporal = getTemporalStatus(demo[0]!, new Date())
  assert(temporal === 'today', 'first demo event should be today')

  const summary = summarizeEvents(demo)
  assert(summary.today >= 1, 'summary today')
  assert(summary.upcoming >= 1, 'summary upcoming')
  assert(summary.past >= 1, 'summary past')

  const filtered = filterEvents(demo, { type: 'legal_deadline' })
  assert(filtered.length === 1, 'filter by type')

  const today = getTodayEvents(demo)
  assert(today.length >= 1, 'today events')

  // case/client queries
  const withCase = eventsService.createEvent(OWNER, {
    title: 'مرتبط با پرونده',
    type: 'court_hearing',
    date: '2026-09-01',
    startTime: '09:00',
    endTime: '10:00',
    caseId: 'case_x',
    clientId: 'client_x',
  })
  assert(withCase.ok, 'create linked event')
  const listed = eventsService.listEvents(OWNER)
  assert(listed.ok, 'list after creates')
  if (!listed.ok) return

  const byCase = eventsService.eventsForCase(listed.data, 'case_x')
  assert(byCase.length === 1, 'eventsForCase')
  const byClient = eventsService.eventsForClient(listed.data, 'client_x')
  assert(byClient.length === 1, 'eventsForClient')

  // delete
  const deleted = eventsService.deleteEvent(OWNER, created.data.id)
  assert(deleted.ok, 'delete failed')
  const afterDelete = eventsService.getEvent(OWNER, created.data.id)
  assert(afterDelete.ok && afterDelete.data === null, 'deleted event still present')

  // storage roundtrip shape
  const raw = readJson<Event[]>(OWNER, 'events', [])
  assert(raw.ok && Array.isArray(raw.data), 'readJson events')

  // ensure writeJson resource type accepts events
  const write = writeJson(OWNER, 'events', raw.data)
  assert(write.ok, 'writeJson events')

  // datetime helpers
  const start = combineDateAndTime('2026-08-26', '14:30')
  assert(start.getHours() === 14 && start.getMinutes() === 30, 'combineDateAndTime')

  removeResource(OWNER, 'events')
  console.log('events-smoke: OK')
}

run()
