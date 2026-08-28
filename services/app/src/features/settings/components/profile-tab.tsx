'use client'

import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { formatIranianMobileLocal } from '@/lib/iranian-phone'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'لطفاً نام خود را وارد کنید.')
    .min(2, 'نام باید حداقل ۲ کاراکتر باشد.')
    .max(30, 'نام نباید بیشتر از ۳۰ کاراکتر باشد.'),
})

type ProfileValues = z.infer<typeof profileSchema>

export function ProfileTab() {
  const user = useAuthStore((s) => s.auth.user)
  const hydrated = useAuthStore((s) => s.auth.hydrated)
  const setUser = useAuthStore((s) => s.auth.setUser)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '' },
    mode: 'onChange',
  })

  useEffect(() => {
    if (!user) return
    form.reset({ name: user.name?.trim() || '' })
  }, [user, form])

  const watchedName = form.watch('name')
  const { isDirty, isSubmitting, isValid } = form.formState

  function onReset() {
    form.reset({ name: user?.name?.trim() || '' })
  }

  async function onSubmit(data: ProfileValues) {
    const result = await api<{ user: { name: string | null } }>(
      '/api/auth/profile',
      {
        method: 'PATCH',
        body: { name: data.name },
      }
    )

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    if (user) {
      setUser({ ...user, name: result.data.user.name })
    }

    form.reset({ name: result.data.user.name?.trim() || data.name })
    toast.success('اطلاعات پروفایل ذخیره شد.')
  }

  const displayName = watchedName.trim() || user?.name?.trim() || 'کاربر'
  const initials = displayName.slice(0, 2)
  const phoneDisplay = user?.phone
    ? formatIranianMobileLocal(user.phone)
    : ''

  if (!hydrated) {
    return (
      <div className='space-y-6'>
        <div className='space-y-2'>
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-4 w-full max-w-md' />
        </div>
        <Skeleton className='h-72 w-full rounded-2xl' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-base font-semibold tracking-tight text-sidebar-foreground'>
          پروفایل
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          اطلاعات شخصی خود را مستقیم ویرایش کنید؛ ذخیره فقط پس از تغییر لازم است.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm'
        >
          <div className='flex items-center justify-between gap-4 border-b border-sidebar-border bg-sidebar-accent/60 px-5 py-5 sm:px-6'>
            <Avatar className='size-14 border border-sidebar-border bg-sidebar shadow-sm ring-2 ring-sidebar-primary/15'>
              <AvatarFallback className='bg-sidebar-primary/10 text-base font-semibold text-sidebar-primary'>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                'hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors sm:inline-flex',
                isDirty
                  ? 'bg-sidebar-primary/10 text-sidebar-primary'
                  : 'bg-sidebar text-muted-foreground'
              )}
            >
              {isDirty ? 'تغییرات ذخیره‌نشده' : 'به‌روز'}
            </span>
          </div>

          <div className='space-y-5 px-5 py-6 sm:px-6'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sidebar-foreground'>نام</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='نام شما'
                      className='h-11 border-sidebar-border bg-background/80 transition-[box-shadow,border-color] focus-visible:border-sidebar-ring focus-visible:ring-sidebar-ring/40'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    نامی که در سایدبار و حساب کاربری نمایش داده می‌شود.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='space-y-2'>
              <p className='text-sm font-medium text-sidebar-foreground'>
                شماره موبایل
              </p>
              <Input
                type='tel'
                value={phoneDisplay}
                readOnly
                disabled
                dir='ltr'
                className='h-11 border-sidebar-border bg-muted/50 text-left text-muted-foreground'
              />
              <p className='text-[0.8rem] text-muted-foreground'>
                شماره ورود به حساب است و از طریق OTP تأیید شده؛ قابل تغییر نیست.
              </p>
            </div>
          </div>

          <div
            className={cn(
              'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
              isDirty
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            )}
          >
            <div className='overflow-hidden'>
              <div className='flex flex-wrap items-center justify-between gap-3 border-t border-sidebar-border bg-sidebar-accent/40 px-5 py-4 sm:px-6'>
                <p className='text-xs text-muted-foreground sm:text-sm'>
                  تغییرات هنوز ذخیره نشده‌اند.
                </p>
                <div className='flex flex-wrap items-center gap-2'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='gap-1.5 text-muted-foreground hover:bg-sidebar hover:text-sidebar-foreground'
                    onClick={onReset}
                    disabled={isSubmitting}
                  >
                    <RotateCcw className='size-3.5' />
                    بازگردانی
                  </Button>
                  <Button
                    type='submit'
                    size='sm'
                    className='gap-1.5 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90'
                    disabled={isSubmitting || !isValid}
                  >
                    <Check className='size-4' />
                    ذخیره تغییرات
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
