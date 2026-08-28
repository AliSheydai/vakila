'use client'

import { RichTextContent } from '@/components/ui/rich-text-content'
import { CASE_CREATED_BY_LABELS, type ClientCase, type Lawyer } from '../../types'
import { formatDate } from '../../utils/format'

type CaseOverviewTabProps = {
  caseItem: ClientCase
  lawyer: Lawyer | null
  sessionsCount: number
  commentsCount: number
}

export function CaseOverviewTab({
  caseItem,
  lawyer,
  sessionsCount,
  commentsCount,
}: CaseOverviewTabProps) {
  return (
    <div className='space-y-4'>
      <section className='rounded-xl border p-4 sm:p-5'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h2 className='text-sm font-semibold'>توضیحات پرونده</h2>
          <span className='rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground'>
            {CASE_CREATED_BY_LABELS[caseItem.createdBy]}
          </span>
        </div>
        <div className='mt-3'>
          <RichTextContent
            html={caseItem.descriptionHtml}
            plainFallback={caseItem.description}
            emptyLabel='توضیحی ثبت نشده است.'
          />
        </div>
      </section>

      <section className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='rounded-xl border p-4'>
          <p className='text-xs text-muted-foreground'>آخرین بروزرسانی</p>
          <p className='mt-1 font-medium'>{formatDate(caseItem.updatedAt)}</p>
        </div>
        <div className='rounded-xl border p-4'>
          <p className='text-xs text-muted-foreground'>تعداد مدارک</p>
          <p className='mt-1 font-medium tabular-nums'>
            {(caseItem.documents?.length ?? 0).toLocaleString('fa-IR')}
          </p>
        </div>
        <div className='rounded-xl border p-4'>
          <p className='text-xs text-muted-foreground'>جلسات مرتبط</p>
          <p className='mt-1 font-medium tabular-nums'>
            {sessionsCount.toLocaleString('fa-IR')}
          </p>
        </div>
        <div className='rounded-xl border p-4'>
          <p className='text-xs text-muted-foreground'>پیام‌های گفتگو</p>
          <p className='mt-1 font-medium tabular-nums'>
            {commentsCount.toLocaleString('fa-IR')}
          </p>
        </div>
      </section>

      <section className='rounded-xl border p-4 sm:p-5'>
        <h2 className='text-sm font-semibold'>اطلاعات خلاصه</h2>
        <dl className='mt-3 grid gap-3 text-sm sm:grid-cols-2'>
          <div>
            <dt className='text-muted-foreground'>وکیل مسئول</dt>
            <dd className='mt-0.5 font-medium'>{lawyer?.name ?? '—'}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>تاریخ ایجاد</dt>
            <dd className='mt-0.5 font-medium'>
              {formatDate(caseItem.createdAt)}
            </dd>
          </div>
          {!caseItem.lawyerSynced && caseItem.createdBy === 'client' ? (
            <div className='sm:col-span-2'>
              <dt className='text-muted-foreground'>وضعیت همگام‌سازی</dt>
              <dd className='mt-0.5 text-sm text-muted-foreground'>
                این پرونده هنوز توسط وکیل تأیید/همگام نشده است. جزئیات پرونده
                قابل ویرایش نیست؛ از تب گفتگو برای پیگیری استفاده کنید.
              </dd>
            </div>
          ) : null}
        </dl>
      </section>
    </div>
  )
}
