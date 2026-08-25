'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { toast } from 'sonner'
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

const otpSchema = z.object({
  code: z
    .string()
    .min(6, 'کد ۶ رقمی را وارد کنید.')
    .max(6, 'کد ۶ رقمی را وارد کنید.'),
})

const SECRET = 'JBSWY3DPEHPK3PXP'

export function SecurityTab() {
  const [enabled, setEnabled] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  })

  function startSetup() {
    form.reset({ code: '' })
    setSetupOpen(true)
  }

  function cancelSetup() {
    form.reset({ code: '' })
    setSetupOpen(false)
  }

  function copySecret() {
    void navigator.clipboard.writeText(SECRET)
    setCopied(true)
    toast.success('کلید مخفی کپی شد.')
    window.setTimeout(() => setCopied(false), 2000)
  }

  function confirmEnable(_data: z.infer<typeof otpSchema>) {
    setEnabled(true)
    setSetupOpen(false)
    form.reset({ code: '' })
    toast.success('تأیید دو مرحله‌ای گوگل فعال شد.')
  }

  function disable() {
    setEnabled(false)
    setSetupOpen(false)
    toast.message('تأیید دو مرحله‌ای غیرفعال شد.')
  }

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-base font-semibold tracking-tight text-sidebar-foreground'>
          تنظیمات
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          امنیت حساب با تأیید دو مرحله‌ای گوگل
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
                <p className='text-sm font-semibold'>
                  تأیید دو مرحله‌ای گوگل
                </p>
                <Badge variant={enabled ? 'secondary' : 'outline'}>
                  {enabled ? 'فعال' : 'غیرفعال'}
                </Badge>
              </div>
              <p className='max-w-md text-sm leading-relaxed text-muted-foreground'>
                با Google Authenticator هنگام ورود، علاوه بر رمز، یک کد یک‌بارمصرف
                هم لازم است.
              </p>
            </div>
          </div>

          {!setupOpen ? (
            enabled ? (
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='shrink-0 gap-1.5 text-destructive hover:bg-destructive/5 hover:text-destructive'
                onClick={disable}
              >
                <ShieldOff className='size-3.5' />
                غیرفعال‌سازی
              </Button>
            ) : (
              <Button
                type='button'
                size='sm'
                className='shrink-0'
                onClick={startSetup}
              >
                فعال‌سازی
              </Button>
            )
          ) : null}
        </div>

        {setupOpen ? (
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
                    اپلیکیشن را از فروشگاه گوشی نصب کنید.
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
                    <div
                      className='flex size-36 items-center justify-center rounded-xl border bg-background p-3 shadow-sm'
                      aria-hidden
                    >
                      <div className='grid size-full grid-cols-5 grid-rows-5 gap-0.5'>
                        {Array.from({ length: 25 }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'rounded-[1px]',
                              [0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 19, 20, 22, 23, 24].includes(
                                i
                              )
                                ? 'bg-foreground'
                                : 'bg-transparent'
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div className='w-full space-y-2 sm:max-w-xs'>
                      <p className='text-xs font-medium text-muted-foreground'>
                        کلید مخفی
                      </p>
                      <div className='flex items-center gap-2'>
                        <code
                          dir='ltr'
                          className='flex-1 truncate rounded-lg border bg-background px-3 py-2 font-mono text-xs tracking-wider'
                        >
                          {SECRET}
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
                      کد نمایش‌داده‌شده در اپ را وارد کنید.
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
                              <InputOTP maxLength={6} {...field}>
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
                        <Button type='submit' className='gap-1.5'>
                          <Smartphone className='size-4' />
                          تأیید و فعال‌سازی
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          onClick={cancelSetup}
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
    </div>
  )
}
