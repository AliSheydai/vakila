import type { Case, Client } from '@/features/cases/types'
import type { Event } from '../types'
import { toDateKey } from './datetime'
import { createId, nowIso } from './id'

type SeedLinks = {
  clients: Client[]
  cases: Case[]
}

function shiftDateKey(base: Date, dayOffset: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  d.setDate(d.getDate() + dayOffset)
  return toDateKey(d)
}

/**
 * دادهٔ نمونه فقط وقتی storage رویدادها خالی است استفاده می‌شود.
 * به Case/Client موجود وصل می‌شود؛ هرگز cases/clients را بازنویسی نمی‌کند.
 */
export function buildDemoEvents(
  ownerId: string,
  links: SeedLinks,
  now: Date = new Date()
): Event[] {
  const timestamp = nowIso()
  const clientA = links.clients[0] ?? null
  const clientB = links.clients[1] ?? null
  const caseA = links.cases[0] ?? null
  const caseB = links.cases[1] ?? null

  const caseAClientId = caseA?.clientId ?? clientA?.id ?? null
  const caseBClientId = caseB?.clientId ?? clientB?.id ?? null

  return [
    {
      id: createId('event'),
      title: 'جلسه پیگیری با موکل',
      type: 'client_meeting',
      date: shiftDateKey(now, 0),
      startTime: '10:00',
      endTime: '11:00',
      location: 'دفتر وکالت',
      description: 'بررسی مدارک جدید و هماهنگی برای جلسه بعدی.',
      clientId: caseAClientId,
      caseId: caseA?.id ?? null,
      status: 'scheduled',
      ownerId,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId('event'),
      title: 'حضور در دادگاه بدوی',
      type: 'court_hearing',
      date: shiftDateKey(now, 3),
      startTime: '09:30',
      endTime: '11:30',
      location: 'مجتمع قضایی شهید بهشتی — شعبه ۱۲',
      description: 'جلسه رسیدگی پرونده.',
      clientId: caseAClientId,
      caseId: caseA?.id ?? null,
      status: 'scheduled',
      ownerId,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId('event'),
      title: 'مهلت تقدیم لایحه دفاعیه',
      type: 'legal_deadline',
      date: shiftDateKey(now, 5),
      startTime: '16:00',
      endTime: '16:30',
      location: '',
      description: 'مهلت قانونی ارسال لایحه؛ نباید به تعویق بیفتد.',
      clientId: caseBClientId,
      caseId: caseB?.id ?? null,
      status: 'scheduled',
      ownerId,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId('event'),
      title: 'جلسه آنلاین هماهنگی',
      type: 'online_meeting',
      date: shiftDateKey(now, 2),
      startTime: '18:00',
      endTime: '18:45',
      location: 'گوگل میت',
      description: 'هماهنگی با موکل درباره مدارک تکمیلی.',
      clientId: clientB?.id ?? null,
      caseId: null,
      status: 'scheduled',
      ownerId,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId('event'),
      title: 'یادآوری تماس با موکل',
      type: 'reminder',
      date: shiftDateKey(now, -2),
      startTime: '17:00',
      endTime: '17:15',
      location: '',
      description: 'پیگیری وضعیت پرداخت هزینه کارشناسی.',
      clientId: clientA?.id ?? null,
      caseId: null,
      status: 'completed',
      ownerId,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
}
