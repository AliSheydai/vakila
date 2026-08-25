'use client'

import type { Client } from '@/features/cases/types'
import { formatDate } from '@/features/cases/utils/format'

type ClientInfoSectionProps = {
  client: Client
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-baseline sm:gap-4'>
      <dt className='text-sm text-muted-foreground'>{label}</dt>
      <dd className='text-sm font-medium whitespace-pre-wrap'>{value || '—'}</dd>
    </div>
  )
}

export function ClientInfoSection({ client }: ClientInfoSectionProps) {
  return (
    <section className='space-y-4'>
      <div>
        <h3 className='text-base font-semibold tracking-tight'>اطلاعات تماس</h3>
        <p className='text-sm text-muted-foreground'>
          مشخصات اصلی موکل که در پرونده‌های مرتبط نیز استفاده می‌شود.
        </p>
      </div>

      <dl className='space-y-3 rounded-lg border p-4 sm:p-5'>
        <InfoRow label='نام' value={client.name} />
        <InfoRow label='شماره موبایل' value={client.phone} />
        <InfoRow label='ایمیل' value={client.email ?? ''} />
        <InfoRow label='کد ملی' value={client.nationalId ?? ''} />
        <InfoRow label='توضیحات' value={client.notes ?? ''} />
        <InfoRow label='تاریخ ثبت' value={formatDate(client.createdAt)} />
        <InfoRow
          label='آخرین بروزرسانی'
          value={formatDate(client.updatedAt)}
        />
      </dl>
    </section>
  )
}
