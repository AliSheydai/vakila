import type { Case, Client } from '../types'
import { createId, nowIso } from './id'

/**
 * دادهٔ نمونه فقط وقتی storage خالی است استفاده می‌شود.
 * هرگز روی دادهٔ موجود کاربر بازنویسی نمی‌کند.
 */
export function buildDemoClients(ownerId: string): Client[] {
  const timestamp = nowIso()

  return [
    {
      id: createId('client'),
      name: 'رضا محمدی',
      phone: '09121234567',
      email: 'reza.mohammadi@example.com',
      nationalId: '0123456789',
      citizenship: 'iranian' as const,
      notes: 'موکل پرونده ملکی',
      attachments: [
        {
          id: createId('att'),
          name: 'کارت-ملی.pdf',
          mimeType: 'application/pdf',
          size: 120_000,
          uploadedAt: timestamp,
          uploadedBy: ownerId,
        },
      ],
      ownerId,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId('client'),
      name: 'سارا احمدی',
      phone: '09351234567',
      email: 'sara.ahmadi@example.com',
      attachments: [],
      ownerId,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId('client'),
      name: 'شرکت تجارت نوین',
      phone: '02188776655',
      email: 'legal@novin.example.com',
      notes: 'شخص حقوقی',
      attachments: [],
      ownerId,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
}

export function buildDemoCases(
  ownerId: string,
  clients: Client[]
): Case[] {
  const [clientA, clientB, clientC] = clients
  const now = Date.now()
  const iso = (daysAgo: number) =>
    new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString()

  return [
    {
      id: createId('case'),
      caseNumber: '1404-001',
      title: 'دعوای خلع ید ملک مسکونی',
      description:
        'موکل مدعی تصرف غیرمجاز ملک مسکونی خود توسط شخص ثالث است. مدارک مالکیت و گزارش کارشناسی در حال تکمیل است.',
      legalArea: 'civil',
      status: 'active',
      clientId: clientA?.id ?? null,
      ownerId,
      fee: {
        id: createId('fee'),
        amount: 120_000_000,
        description: 'حق‌الزحمه توافقی مرحله بدوی',
        dueDate: null,
        createdAt: iso(20),
        updatedAt: iso(20),
      },
      payments: [
        {
          id: createId('pay'),
          amount: 40_000_000,
          date: iso(15),
          method: 'transfer',
          source: 'manual',
          status: 'completed',
          description: 'پیش‌پرداخت',
          createdAt: iso(15),
          updatedAt: iso(15),
        },
      ],
      expenses: [
        {
          id: createId('exp'),
          title: 'هزینه کارشناسی',
          category: 'expert',
          amount: 8_000_000,
          date: iso(10),
          description: 'کارشناسی رسمی دادگستری',
          createdAt: iso(10),
          updatedAt: iso(10),
        },
      ],
      attachments: [
        {
          id: createId('att'),
          name: 'سند-مالکیت.pdf',
          mimeType: 'application/pdf',
          size: 245_000,
          uploadedAt: iso(18),
          uploadedBy: ownerId,
        },
      ],
      createdAt: iso(20),
      updatedAt: iso(2),
    },
    {
      id: createId('case'),
      caseNumber: '1404-002',
      title: 'پرونده طلاق توافقی',
      description: 'درخواست طلاق توافقی؛ جلسات مشاوره در جریان است.',
      legalArea: 'family',
      status: 'awaiting_action',
      clientId: clientB?.id ?? null,
      ownerId,
      fee: {
        id: createId('fee'),
        amount: 45_000_000,
        description: 'حق‌الزحمه کامل',
        dueDate: iso(-7),
        createdAt: iso(12),
        updatedAt: iso(12),
      },
      payments: [],
      expenses: [],
      attachments: [],
      createdAt: iso(12),
      updatedAt: iso(1),
    },
    {
      id: createId('case'),
      caseNumber: '1403-118',
      title: 'اختلاف قرارداد پیمانکاری',
      description: 'مطالبه وجه قرارداد و خسارت تأخیر تأدیه.',
      legalArea: 'commercial',
      status: 'closed',
      clientId: clientC?.id ?? null,
      ownerId,
      fee: {
        id: createId('fee'),
        amount: 200_000_000,
        createdAt: iso(90),
        updatedAt: iso(90),
      },
      payments: [
        {
          id: createId('pay'),
          amount: 100_000_000,
          date: iso(80),
          method: 'cheque',
          source: 'manual',
          status: 'completed',
          createdAt: iso(80),
          updatedAt: iso(80),
        },
        {
          id: createId('pay'),
          amount: 100_000_000,
          date: iso(40),
          method: 'transfer',
          source: 'manual',
          status: 'completed',
          createdAt: iso(40),
          updatedAt: iso(40),
        },
      ],
      expenses: [
        {
          id: createId('exp'),
          title: 'هزینه دادرسی',
          category: 'court',
          amount: 12_500_000,
          date: iso(85),
          createdAt: iso(85),
          updatedAt: iso(85),
        },
      ],
      attachments: [
        {
          id: createId('att'),
          name: 'قرارداد.docx',
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 88_000,
          uploadedAt: iso(88),
          uploadedBy: ownerId,
        },
        {
          id: createId('att'),
          name: 'رأی-نهایی.pdf',
          mimeType: 'application/pdf',
          size: 156_000,
          uploadedAt: iso(35),
          uploadedBy: ownerId,
        },
      ],
      createdAt: iso(90),
      updatedAt: iso(30),
    },
    {
      id: createId('case'),
      caseNumber: '1404-010',
      title: 'شکایت کلاهبرداری رایانه‌ای',
      description: 'پرونده جدید؛ در حال جمع‌آوری مدارک اولیه.',
      legalArea: 'criminal',
      status: 'new',
      clientId: clientA?.id ?? null,
      ownerId,
      fee: null,
      payments: [],
      expenses: [],
      attachments: [],
      createdAt: iso(3),
      updatedAt: iso(3),
    },
  ]
}
