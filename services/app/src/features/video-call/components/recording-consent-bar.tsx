'use client'

import { useState } from 'react'
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
    <div className='flex items-center gap-2 border-b px-4 py-2 text-sm'>
      <Checkbox
        id={`recording-consent-${eventId}`}
        checked={consent}
        onCheckedChange={(v) => void handleChange(v === true)}
      />
      <Label htmlFor={`recording-consent-${eventId}`} className='cursor-pointer'>
        {role === 'host'
          ? 'با ضبط جلسه (پس از رضایت موکل) موافقم.'
          : 'با ضبط این جلسه برای مستندسازی موافقم.'}
        {saved ? (
          <span className='ms-2 text-xs text-muted-foreground'>(ثبت شد)</span>
        ) : null}
      </Label>
    </div>
  )
}
