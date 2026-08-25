'use client'

import Link from 'next/link'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Case } from '@/features/cases/types'
import { LEGAL_AREA_LABELS } from '@/features/cases/types'
import { formatDate } from '@/features/cases/utils/format'
import { CaseStatusBadge } from '@/features/cases/components/case-status-badge'

type ClientCasesSectionProps = {
  cases: Case[]
}

export function ClientCasesSection({ cases }: ClientCasesSectionProps) {
  return (
    <section className='space-y-4'>
      <div>
        <h3 className='text-base font-semibold tracking-tight'>پرونده‌ها</h3>
        <p className='text-sm text-muted-foreground'>
          تمام پرونده‌های مرتبط با این موکل.
        </p>
      </div>

      {cases.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center'>
          <div className='mb-3 flex size-11 items-center justify-center rounded-full bg-muted'>
            <FolderOpen className='size-5 text-muted-foreground' />
          </div>
          <p className='text-sm font-medium'>هنوز پرونده‌ای متصل نیست</p>
          <p className='mt-1 max-w-sm text-xs text-muted-foreground'>
            هنگام ایجاد یا ویرایش پرونده می‌توانید این موکل را به آن متصل کنید.
          </p>
          <Button asChild variant='outline' size='sm' className='mt-4'>
            <Link href='/admin/cases'>رفتن به پرونده‌ها</Link>
          </Button>
        </div>
      ) : (
        <ul className='space-y-3'>
          {cases.map((item) => (
            <li key={item.id}>
              <Link
                href={`/admin/cases/${item.id}`}
                className='flex flex-col gap-3 rounded-xl border bg-background p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between'
              >
                <div className='min-w-0 space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='truncate font-semibold tracking-tight'>
                      {item.title}
                    </p>
                    <CaseStatusBadge status={item.status} />
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    <span className='tabular-nums'>{item.caseNumber}</span>
                    {' · '}
                    {LEGAL_AREA_LABELS[item.legalArea]}
                  </p>
                </div>
                <div className='text-xs text-muted-foreground sm:text-end'>
                  <p>آخرین بروزرسانی</p>
                  <p className='mt-0.5 font-medium text-foreground'>
                    {formatDate(item.updatedAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
