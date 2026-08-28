'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { formatIranianMobileLocal, isValidIranianMobile } from '@/lib/iranian-phone'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useLandingActions,
  type RequestIntent,
} from './landing-actions'

const INTENT_COPY: Record<
  RequestIntent,
  { title: string; description: string; submit: string }
> = {
  consultation: {
    title: 'درخواست مشاوره',
    description:
      'اطلاعات تماس و خلاصه موضوع را بنویسید تا درخواست شما بررسی شود.',
    submit: 'ارسال درخواست مشاوره',
  },
  case: {
    title: 'درخواست پذیرش پرونده',
    description:
      'موضوع پرونده را به‌صورت مختصر توضیح دهید تا امکان پذیرش بررسی شود.',
    submit: 'ارسال درخواست پذیرش',
  },
  documents: {
    title: 'ارسال مدارک برای بررسی',
    description:
      'خلاصه موضوع را بنویسید. در مرحله بعد می‌توانید مدارک را ارسال کنید.',
    submit: 'ثبت درخواست بررسی',
  },
}

export function RequestDialog() {
  const { open, intent, closeRequest } = useLandingActions()
  const user = useAuthStore((state) => state.auth.user)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const copy = intent ? INTENT_COPY[intent] : INTENT_COPY.consultation

  useEffect(() => {
    if (!open || intent !== 'consultation') return

    if (user) {
      setName(user.name?.trim() ?? '')
      setPhone(formatIranianMobileLocal(user.phone))
    } else {
      setName('')
      setPhone('')
    }
    setMessage('')
  }, [open, intent, user])

  function resetMessage() {
    setMessage('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast.error('لطفاً همه فیلدها را تکمیل کنید.')
      return
    }

    if (!isValidIranianMobile(phone)) {
      toast.error('شماره موبایل معتبر نیست.')
      return
    }

    if (intent !== 'consultation') {
      toast.error('این نوع درخواست هنوز از این مسیر پشتیبانی نمی‌شود.')
      return
    }

    setSubmitting(true)
    const result = await api('/api/consultation-requests', {
      method: 'POST',
      body: {
        name: name.trim(),
        phone: phone.trim(),
        message: message.trim(),
      },
    })
    setSubmitting(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success('درخواست شما ثبت شد و به‌زودی بررسی می‌شود.')
    resetMessage()
    closeRequest()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeRequest()
      }}
    >
      <DialogContent className='overflow-hidden sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='min-w-0 space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='landing-name'>نام و نام خانوادگی</Label>
            <Input
              id='landing-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='مثلاً علی محمدی'
              autoComplete='name'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='landing-phone'>شماره تماس</Label>
            <Input
              id='landing-phone'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='۰۹۱۲۰۰۰۰۰۰۰'
              inputMode='tel'
              autoComplete='tel'
              dir='ltr'
              className='text-end'
            />
          </div>
          <div className='min-w-0 space-y-2'>
            <Label htmlFor='landing-message'>شرح مختصر موضوع</Label>
            <Textarea
              id='landing-message'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder='موضوع پرونده یا سؤال خود را کوتاه بنویسید…'
              rows={4}
              className='max-h-48'
            />
          </div>

          <DialogFooter className='gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={closeRequest}
              disabled={submitting}
            >
              انصراف
            </Button>
            <Button type='submit' disabled={submitting}>
              {submitting ? 'در حال ارسال…' : copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
