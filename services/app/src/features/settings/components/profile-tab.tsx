'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  formatIranianMobileLocal,
  isValidIranianMobile,
} from '@/lib/iranian-phone'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'لطفاً نام خود را وارد کنید.')
    .min(2, 'نام باید حداقل ۲ کاراکتر باشد.')
    .max(30, 'نام نباید بیشتر از ۳۰ کاراکتر باشد.'),
  phone: z
    .string()
    .min(1, 'لطفاً شماره موبایل خود را وارد کنید.')
    .refine(isValidIranianMobile, {
      message: 'شماره موبایل ایران معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹',
    })
    .transform(formatIranianMobileLocal),
})

type ProfileValues = z.infer<typeof profileSchema>

const INITIAL: ProfileValues = {
  name: 'علی',
  phone: '09123456789',
}

export function ProfileTab() {
  const [profile, setProfile] = useState(INITIAL)
  const [editing, setEditing] = useState(false)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  })

  function startEdit() {
    form.reset(profile)
    setEditing(true)
  }

  function cancelEdit() {
    form.reset(profile)
    setEditing(false)
  }

  function onSubmit(data: ProfileValues) {
    setProfile(data)
    setEditing(false)
    toast.success('اطلاعات پروفایل ذخیره شد.')
  }

  const initials = profile.name.slice(0, 2)

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-base font-semibold tracking-tight'>پروفایل</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          مشاهده و ویرایش نام و شماره موبایل
        </p>
      </div>

      <div className='overflow-hidden rounded-2xl border bg-card'>
        <div className='flex items-center gap-4 border-b bg-muted/30 px-5 py-5 sm:px-6'>
          <Avatar className='size-14 border bg-background shadow-sm'>
            <AvatarFallback className='text-base font-medium'>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-base font-semibold'>{profile.name}</p>
            <p className='mt-0.5 truncate text-sm text-muted-foreground' dir='ltr'>
              {profile.phone}
            </p>
          </div>
          {!editing ? (
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='shrink-0 gap-1.5'
              onClick={startEdit}
            >
              <Pencil className='size-3.5' />
              ویرایش
            </Button>
          ) : null}
        </div>

        <div className='px-5 py-5 sm:px-6'>
          {editing ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-5'
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='نام شما'
                          autoFocus
                          className='h-11'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شماره موبایل</FormLabel>
                      <FormControl>
                        <Input
                          type='tel'
                          inputMode='tel'
                          autoComplete='tel'
                          placeholder='09123456789'
                          dir='ltr'
                          className='h-11 text-left'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='flex flex-wrap items-center gap-2 pt-1'>
                  <Button type='submit' className='gap-1.5'>
                    <Check className='size-4' />
                    ذخیره تغییرات
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    className='gap-1.5'
                    onClick={cancelEdit}
                  >
                    <X className='size-4' />
                    انصراف
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <dl className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-1'>
                <dt className='text-xs font-medium text-muted-foreground'>
                  نام
                </dt>
                <dd className='text-sm font-medium'>{profile.name}</dd>
              </div>
              <div className='space-y-1'>
                <dt className='text-xs font-medium text-muted-foreground'>
                  شماره موبایل
                </dt>
                <dd className='text-sm font-medium' dir='ltr'>
                  {profile.phone}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </div>
  )
}
