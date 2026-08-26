'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  CASE_STATUS_LABELS,
  LEGAL_AREA_LABELS,
  type Case,
} from '../types'
import { formatDate } from '../utils/format'
import { useCasesStore } from '../stores/cases-store'

type CaseInfoTabProps = {
  caseItem: Case
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-baseline sm:gap-4'>
      <dt className='text-sm text-muted-foreground'>{label}</dt>
      <dd className='text-sm font-medium'>{value}</dd>
    </div>
  )
}

export function CaseInfoTab({ caseItem }: CaseInfoTabProps) {
  const updateCase = useCasesStore((state) => state.updateCase)
  const [description, setDescription] = useState(caseItem.description)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDescription(caseItem.description)
  }, [caseItem.id, caseItem.description, caseItem.updatedAt])

  const isDirty = description !== caseItem.description

  function handleSaveDescription() {
    setSaving(true)
    const result = updateCase(caseItem.id, { description })
    setSaving(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('شرح پرونده ذخیره شد.')
  }

  return (
    <div className='space-y-8'>
      <section className='space-y-4'>
        <h3 className='text-base font-semibold tracking-tight'>اطلاعات اصلی</h3>
        <dl className='space-y-3 rounded-lg border p-4 sm:p-5'>
          <InfoRow label='عنوان' value={caseItem.title} />
          <InfoRow label='شماره پرونده' value={caseItem.caseNumber} />
          <InfoRow
            label='حوزه حقوقی'
            value={LEGAL_AREA_LABELS[caseItem.legalArea]}
          />
          <InfoRow label='وضعیت' value={CASE_STATUS_LABELS[caseItem.status]} />
          <InfoRow label='تاریخ ایجاد' value={formatDate(caseItem.createdAt)} />
          <InfoRow
            label='آخرین بروزرسانی'
            value={formatDate(caseItem.updatedAt)}
          />
        </dl>
      </section>

      <Separator />

      <section className='space-y-4'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h3 className='text-base font-semibold tracking-tight'>شرح پرونده</h3>
            <p className='text-sm text-muted-foreground'>
              شرح کامل پرونده را اینجا بنویسید و ذخیره کنید.
            </p>
          </div>
          <Button
            size='sm'
            disabled={!isDirty || saving}
            onClick={handleSaveDescription}
          >
            {saving ? 'در حال ذخیره...' : 'ذخیره شرح'}
          </Button>
        </div>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={12}
          className='min-h-56 resize-y text-sm leading-7'
          placeholder='شرح پرونده، جزئیات موضوع، سوابق و نکات مهم را اینجا بنویسید...'
        />
      </section>
    </div>
  )
}
