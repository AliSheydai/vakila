'use client'

import { useState } from 'react'
import { CircleCheck, Shield } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

type RecordingConsentBarProps = {
  eventId: string
  role: 'host' | 'client'
}

export function RecordingConsentBar({ eventId, role }: RecordingConsentBarProps) {
  const [consent, setConsent] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = async (checked: boolean) => {
    setConsent(checked)
    try {
      const res = await fetch(`/api/events/${eventId}/recording-consent`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: checked }),
      })
      const json = (await res.json()) as { ok: boolean }
      setSaved(json.ok && checked)
    } catch {
      setConsent(false)
    }
  }

  return (
    <div className='flex items-start gap-3 border-b border-border/60 bg-muted/40 px-4 py-3 text-sm sm:px-5'>
      <Shield className='mt-0.5 size-4 shrink-0 text-primary' />
      <div className='flex min-w-0 flex-1 items-start gap-2'>
        <Checkbox
          id={`recording-consent-${eventId}`}
          checked={consent}
          onCheckedChange={(v) => void handleChange(v === true)}
        />
        <Label
          htmlFor={`recording-consent-${eventId}`}
          className='cursor-pointer leading-6 text-start'
        >
          {role === 'host'
            ? 'با ضبط جلسه (پس از رضایت موکل) موافقم.'
            : 'با ضبط این جلسه برای مستندسازی موافقم.'}
          {saved ? (
            <span className='ms-2 inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400'>
              <CircleCheck className='size-3.5' />
              ثبت شد
            </span>
          ) : null}
        </Label>
      </div>
    </div>
  )
}
