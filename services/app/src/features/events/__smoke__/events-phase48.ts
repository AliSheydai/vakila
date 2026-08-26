/**
 * Phase 4.8 — سناریوهای لایه داده + تاریخ فارسی.
 * Run: npx tsx src/features/events/__smoke__/events-phase48.ts
 */

import * as eventsService from '../services/events-service'
import { useEventsStore } from '../stores/events-store'
import {
  formatEventDate,
  formatEventTime,
  formatMonthTitle,
  formatTimeRange,
  getTemporalStatus,
  getWeekDays,
  toDateKey,
} from '../utils/datetime'
import {
  filterEvents,
  getPastEvents,
  getTodayEvents,
  getUpcomingEvents,
} from '../utils/filters'
import { buildDemoEvents } from '../utils/seed'

const OWNER = 'ACC001_P48'

function installMockLocalStorage(): Map<string, string> {
  const store = new Map<string, string>()
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
  const key = `vakila:admin:v1:${OWNER}:events`

  // 4. ایجاد
  const created = eventsService.createEvent(OWNER, {
    title: 'جلسه با علی رضایی',
    type: 'client_meeting',
    date: toDateKey(new Date()),
    startTime: '10:00',
    endTime: '11:00',
    description: 'بررسی مدارک',
    clientId: 'client_ali',
    caseId: 'case_property',
  })
  assert(created.ok, '4 create')
  if (!created.ok) return

  // 5. ایجاد با تاریخ از پیش‌پر (شبیه‌سازی کلیک تقویم)
  const fromCalendar = eventsService.createEvent(OWNER, {
    title: 'از روی تقویم',
    type: 'reminder',
    date: '2026-09-12',
    startTime: '14:00',
    endTime: '14:30',
  })
  assert(fromCalendar.ok && fromCalendar.data.date === '2026-09-12', '5 calendar prefill')

  // 6. ویرایش
  const updated = eventsService.updateEvent(OWNER, created.data.id, {
    title: 'جلسه ویرایش‌شده با علی',
    location: 'دفتر',
  })
  assert(updated.ok && updated.data.title.includes('ویرایش'), '6 update')
  assert(updated.ok && updated.data.clientId === 'client_ali', '6 keep client')
  assert(updated.ok && updated.data.caseId === 'case_property', '6 keep case')

  // 10–11. اتصال به موکل و پرونده
  const listed = eventsService.listEvents(OWNER)
  assert(listed.ok, 'list')
  if (!listed.ok) return
  assert(
    eventsService.eventsForClient(listed.data, 'client_ali').length === 1,
    '10 client link'
  )
  assert(
    eventsService.eventsForCase(listed.data, 'case_property').length === 1,
    '11 case link'
  )

  // 8. جستجو
  const context = {
    clientNameById: { client_ali: 'علی رضایی' },
    caseTitleById: { case_property: 'پرونده ملکی' },
  }
  assert(
    filterEvents(listed.data, { query: 'علی' }, context).length >= 1,
    '8 search client name'
  )
  assert(
    filterEvents(listed.data, { query: 'ملکی' }, context).length >= 1,
    '8 search case title'
  )
  assert(
    filterEvents(listed.data, { query: 'مدارک' }, context).length >= 1,
    '8 search description'
  )

  // 9. فیلتر نوع / ارتباط
  assert(
    filterEvents(listed.data, { type: 'client_meeting' }).every(
      (event) => event.type === 'client_meeting'
    ),
    '9 type filter'
  )
  assert(
    filterEvents(listed.data, { relation: 'with_case' }).every((event) =>
      Boolean(event.caseId)
    ),
    '9 relation case'
  )

  // 12–14. امروز / آینده / گذشته
  const demo = buildDemoEvents(
    OWNER,
    {
      cases: [
        {
          id: 'case_property',
          title: 'پرونده ملکی',
        } as never,
      ],
      clients: [{ id: 'client_ali', name: 'علی رضایی' } as never],
    },
    new Date()
  )
  assert(getTodayEvents(demo).length >= 1, '12 today')
  assert(getUpcomingEvents(demo).length >= 1, '13 upcoming')
  assert(getPastEvents(demo).length >= 1, '14 past')
  assert(
    filterEvents(demo, { temporal: 'today' }).every(
      (event) => getTemporalStatus(event) === 'today'
    ),
    '9 temporal today'
  )
  assert(
    filterEvents(demo, { temporal: 'upcoming' }).every(
      (event) => getTemporalStatus(event) === 'upcoming'
    ),
    '9 temporal upcoming'
  )
  assert(
    filterEvents(demo, { temporal: 'past' }).every(
      (event) => getTemporalStatus(event) === 'past'
    ),
    '9 temporal past'
  )

  // 16. حفظ در localStorage + 15 شبیه‌سازی refresh (hydrate دوباره)
  assert(store.has(key), '16 storage key')
  const firstRead = eventsService.listEvents(OWNER)
  assert(firstRead.ok && firstRead.data.length >= 2, '16 first read')

  useEventsStore.getState().reset()
  const hydrated = useEventsStore.getState().hydrate(OWNER)
  assert(hydrated.ok, '15 hydrate')
  assert(useEventsStore.getState().events.length >= 2, '15 refresh keeps data')

  // hydrate با seed نباید داده موجود را پاک کند
  const seeded = useEventsStore.getState().hydrate(OWNER, { seedIfEmpty: true })
  assert(seeded.ok, 'seedIfEmpty on existing')
  assert(
    useEventsStore.getState().events.some((event) => event.id === created.data.id),
    'seed must not overwrite'
  )

  // 7. حذف
  const deleted = eventsService.deleteEvent(OWNER, created.data.id)
  assert(deleted.ok, '7 delete')
  const gone = eventsService.getEvent(OWNER, created.data.id)
  assert(gone.ok && gone.data === null, '7 gone')
  useEventsStore.getState().hydrate(OWNER)
  assert(
    !useEventsStore.getState().events.some((event) => event.id === created.data.id),
    '7 refresh after delete'
  )

  // 19. تاریخ/زمان فارسی
  const faDate = formatEventDate('2026-08-26')
  const faTime = formatEventTime('10:00')
  const faMonth = formatMonthTitle(new Date(2026, 7, 26))
  const faRange = formatTimeRange('10:00', '11:00')
  assert(/[۰-۹]/.test(faDate) || /[٠-٩]/.test(faDate) || faDate.includes('۱۴'), '19 fa date')
  assert(faTime.length > 0 && faRange.includes('–'), '19 fa time')
  assert(faMonth.length > 0, '19 fa month')
  assert(getWeekDays(new Date()).length === 7, 'week starts saturday grid')

  console.log('events-phase48: OK')
  console.log('  date:', faDate)
  console.log('  time:', faTime)
  console.log('  month:', faMonth)
}

run()
