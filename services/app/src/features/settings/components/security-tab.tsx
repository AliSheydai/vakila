'use client'

import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  Smartphone,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const otpSchema = z.object({
  code: z
    .string()
    .min(6, 'کد ۶ رقمی را وارد کنید.')
    .max(6, 'کد ۶ رقمی را وارد کنید.'),
})

type TotpStatus = {
  enabled: boolean
  confirmedAt: string | null
}

type TotpSetup = {
  secret: string
  otpauthUrl: string
  qrDataUrl: string
}

export function SecurityTab() {
  const [status, setStatus] = useState<TotpStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [setup, setSetup] = useState<TotpSetup | null>(null)
  const [setupLoading, setSetupLoading] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [disableOpen, setDisableOpen] = useState(false)
  const [disableLoading, setDisableLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  })

  const disableForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  })

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true)
    const result = await api<TotpStatus>('/api/auth/totp/status')
    setLoadingStatus(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setStatus(result.data)
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const enabled = Boolean(status?.enabled)

  async function startSetup() {
    setSetupLoading(true)
    form.reset({ code: '' })
    const result = await api<TotpSetup>('/api/auth/totp/setup', {
      method: 'POST',
    })
    setSetupLoading(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setSetup(result.data)
  }

  async function cancelSetup() {
    form.reset({ code: '' })
    setSetup(null)
    await api('/api/auth/totp/confirm', { method: 'DELETE' })
  }

  function copySecret() {
    if (!setup?.secret) return
    void navigator.clipboard.writeText(setup.secret)
    setCopied(true)
    toast.success('کلید مخفی کپی شد.')
    window.setTimeout(() => setCopied(false), 2000)
  }

  async function confirmEnable(data: z.infer<typeof otpSchema>) {
    setConfirmLoading(true)
    const result = await api<TotpStatus>('/api/auth/totp/confirm', {
      method: 'POST',
      body: { code: data.code },
    })
    setConfirmLoading(false)

    if (!result.ok) {
      toast.error(result.error)
      form.setValue('code', '')
      return
    }

    setStatus(result.data)
    setSetup(null)
    form.reset({ code: '' })
    toast.success('ورود دو مرحله‌ای فعال شد.')
  }

  async function confirmDisable(data: z.infer<typeof otpSchema>) {
    setDisableLoading(true)
    const result = await api<TotpStatus>('/api/auth/totp/disable', {
      method: 'POST',
      body: { code: data.code },
    })
    setDisableLoading(false)

    if (!result.ok) {
      toast.error(result.error)
      disableForm.setValue('code', '')
      return
    }

    setStatus(result.data)
    setDisableOpen(false)
    disableForm.reset({ code: '' })
    toast.message('ورود دو مرحله‌ای غیرفعال شد.')
  }

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-base font-semibold tracking-tight text-sidebar-foreground'>
          ورود دو مرحله‌ای
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          پس از تأیید پیامک، کد یک‌بارمصرف اپلیکیشن Authenticator هم لازم است.
        </p>
      </div>

      <div className='overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm'>
        <div className='flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
          <div className='flex items-start gap-4'>
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl',
                enabled
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-sidebar-accent text-muted-foreground'
              )}
            >
              {enabled ? (
                <ShieldCheck className='size-5' strokeWidth={1.75} />
              ) : (
                <Shield className='size-5' strokeWidth={1.75} />
              )}
            </div>
            <div className='space-y-1.5'>
              <div className='flex flex-wrap items-center gap-2'>
                <p className='text-sm font-semibold'>Google Authenticator</p>
                {loadingStatus ? (
                  <Badge variant='outline'>در حال بررسی…</Badge>
                ) : (
                  <Badge variant={enabled ? 'secondary' : 'outline'}>
                    {enabled ? 'فعال' : 'غیرفعال'}
                  </Badge>
                )}
              </div>
              <p className='max-w-md text-sm leading-relaxed text-muted-foreground'>
                با فعال‌سازی، هنگام ورود به پنل پس از کد پیامک، کد ۶ رقمی اپ
                Authenticator هم درخواست می‌شود.
              </p>
            </div>
          </div>

          {!setup ? (
            enabled ? (
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='shrink-0 gap-1.5 text-destructive hover:bg-destructive/5 hover:text-destructive'
                disabled={loadingStatus}
                onClick={() => {
                  disableForm.reset({ code: '' })
                  setDisableOpen(true)
                }}
              >
                <ShieldOff className='size-3.5' />
                غیرفعال‌سازی
              </Button>
            ) : (
              <Button
                type='button'
                size='sm'
                className='shrink-0'
                disabled={loadingStatus || setupLoading}
                onClick={() => void startSetup()}
              >
                {setupLoading ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : null}
                فعال‌سازی
              </Button>
            )
          ) : null}
        </div>

        {setup ? (
          <div className='space-y-6 border-t border-sidebar-border bg-sidebar-accent/40 px-5 py-6 sm:px-6'>
            <ol className='space-y-5'>
              <li className='flex gap-3'>
                <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-[11px] font-semibold text-sidebar-primary-foreground'>
                  ۱
                </span>
                <div className='space-y-1 pt-0.5'>
                  <p className='text-sm font-medium'>
                    نصب Google Authenticator
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    اپلیکیشن را از فروشگاه گوشی نصب کنید (یا هر اپ TOTP مشابه).
                  </p>
                </div>
              </li>

              <li className='flex gap-3'>
                <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-[11px] font-semibold text-sidebar-primary-foreground'>
                  ۲
                </span>
                <div className='min-w-0 flex-1 space-y-3 pt-0.5'>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>اسکن کد QR</p>
                    <p className='text-sm text-muted-foreground'>
                      کد را اسکن کنید یا کلید مخفی را دستی وارد کنید.
                    </p>
                  </div>

                  <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={setup.qrDataUrl}
                      alt='کد QR ورود دو مرحله‌ای'
                      className='size-40 rounded-xl border bg-white p-2 shadow-sm'
                      width={160}
                      height={160}
                    />

                    <div className='w-full space-y-2 sm:max-w-xs'>
                      <p className='text-xs font-medium text-muted-foreground'>
                        کلید مخفی
                      </p>
                      <div className='flex items-center gap-2'>
                        <code
                          dir='ltr'
                          className='flex-1 truncate rounded-lg border bg-background px-3 py-2 font-mono text-xs tracking-wider'
                        >
                          {setup.secret}
                        </code>
                        <Button
                          type='button'
                          variant='outline'
                          size='icon'
                          className='size-9 shrink-0'
                          onClick={copySecret}
                          aria-label='کپی کلید مخفی'
                        >
                          {copied ? (
                            <Check className='size-4 text-emerald-600' />
                          ) : (
                            <Copy className='size-4' />
                          )}
                        </Button>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        این کلید را فقط یک‌بار می‌بینید؛ پس از فعال‌سازی ذخیره
                        می‌شود.
                      </p>
                    </div>
                  </div>
                </div>
              </li>

              <li className='flex gap-3'>
                <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-[11px] font-semibold text-sidebar-primary-foreground'>
                  ۳
                </span>
                <div className='min-w-0 flex-1 space-y-3 pt-0.5'>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>تأیید کد ۶ رقمی</p>
                    <p className='text-sm text-muted-foreground'>
                      کد نمایش‌داده‌شده در اپ را وارد کنید تا فعال‌سازی کامل
                      شود.
                    </p>
                  </div>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(confirmEnable)}
                      className='space-y-4'
                    >
                      <FormField
                        control={form.control}
                        name='code'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='sr-only'>کد تأیید</FormLabel>
                            <FormControl>
                              <InputOTP
                                maxLength={6}
                                {...field}
                                disabled={confirmLoading}
                              >
                                <InputOTPGroup dir='ltr'>
                                  {Array.from({ length: 6 }).map((_, i) => (
                                    <InputOTPSlot key={i} index={i} />
                                  ))}
                                </InputOTPGroup>
                              </InputOTP>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className='flex flex-wrap gap-2'>
                        <Button
                          type='submit'
                          className='gap-1.5'
                          disabled={confirmLoading}
                        >
                          {confirmLoading ? (
                            <Loader2 className='size-4 animate-spin' />
                          ) : (
                            <Smartphone className='size-4' />
                          )}
                          تأیید و فعال‌سازی
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          disabled={confirmLoading}
                          onClick={() => void cancelSetup()}
                        >
                          انصراف
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </li>
            </ol>
          </div>
        ) : null}
      </div>

      <Dialog
        open={disableOpen}
        onOpenChange={(open) => {
          if (!disableLoading) {
            setDisableOpen(open)
            if (!open) disableForm.reset({ code: '' })
          }
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>غیرفعال‌سازی ورود دو مرحله‌ای</DialogTitle>
            <DialogDescription>
              برای غیرفعال‌سازی، کد ۶ رقمی فعلی در Google Authenticator را وارد
              کنید.
            </DialogDescription>
          </DialogHeader>
          <Form {...disableForm}>
            <form
              onSubmit={disableForm.handleSubmit(confirmDisable)}
              className='space-y-4'
            >
              <FormField
                control={disableForm.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='sr-only'>کد تأیید</FormLabel>
                    <FormControl>
                      <div className='flex justify-center' dir='ltr'>
                        <InputOTP
                          maxLength={6}
                          {...field}
                          disabled={disableLoading}
                          autoFocus
                        >
                          <InputOTPGroup dir='ltr' className='gap-2'>
                            {Array.from({ length: 6 }).map((_, i) => (
                              <InputOTPSlot key={i} index={i} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className='gap-2 sm:gap-0'>
                <Button
                  type='button'
                  variant='ghost'
                  disabled={disableLoading}
                  onClick={() => setDisableOpen(false)}
                >
                  انصراف
                </Button>
                <Button
                  type='submit'
                  variant='destructive'
                  disabled={disableLoading}
                >
                  {disableLoading ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : null}
                  غیرفعال کن
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
