'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Client } from '@/features/cases/types'
import { useCasesStore } from '@/features/cases/stores/cases-store'

/** تبدیل ارقام فارسی/عربی به لاتین */
function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
}

/** شماره تماس ایران: موبایل ۰۹… یا تلفن ثابت ۰… */
function isValidIranPhone(value: string): boolean {
  const digits = toLatinDigits(value).replace(/[\s\-()]/g, '')
  if (/^09\d{9}$/.test(digits)) return true
  if (/^\+989\d{9}$/.test(digits)) return true
  if (/^00989\d{9}$/.test(digits)) return true
  if (/^0\d{10}$/.test(digits)) return true
  return false
}

function isValidNationalId(value: string): boolean {
  const digits = toLatinDigits(value).replace(/\s/g, '')
  return /^\d{10}$/.test(digits)
}

function normalizePhone(value: string): string {
  return toLatinDigits(value).replace(/[\s\-()]/g, '').trim()
}

function normalizeNationalId(value: string): string {
  return toLatinDigits(value).replace(/\s/g, '').trim()
}

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'نام و نام خانوادگی الزامی است.'),
  phone: z
    .string()
    .trim()
    .min(1, 'شماره موبایل الزامی است.')
    .refine(isValidIranPhone, {
      message: 'شماره موبایل معتبر نیست. مثلاً ۰۹۱۲۱۲۳۴۵۶۷',
    }),
  email: z.union([
    z.literal(''),
    z.string().trim().email('ایمیل معتبر نیست.'),
  ]),
  nationalId: z
    .string()
    .trim()
    .refine((value) => value === '' || isValidNationalId(value), {
      message: 'کد ملی باید ۱۰ رقم باشد.',
    }),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type ClientsMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Client | null
}

function getDefaultValues(currentRow?: Client | null): FormValues {
  if (currentRow) {
    return {
      name: currentRow.name,
      phone: currentRow.phone,
      email: currentRow.email ?? '',
      nationalId: currentRow.nationalId ?? '',
      notes: currentRow.notes ?? '',
    }
  }

  return {
    name: '',
    phone: '',
    email: '',
    nationalId: '',
    notes: '',
  }
}

export function ClientsMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: ClientsMutateDrawerProps) {
  const isUpdate = !!currentRow
  const addClient = useCasesStore((state) => state.addClient)
  const updateClient = useCasesStore((state) => state.updateClient)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(currentRow),
  })

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(currentRow))
    }
  }, [open, currentRow, form])

  async function onSubmit(values: FormValues) {
    setSubmitting(true)

    try {
      const payload = {
        name: values.name.trim(),
        phone: normalizePhone(values.phone),
        email: values.email.trim() || undefined,
        nationalId: normalizeNationalId(values.nationalId) || undefined,
        notes: values.notes?.trim() || undefined,
      }

      const result = isUpdate
        ? updateClient(currentRow.id, payload)
        : addClient(payload)

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(
        isUpdate ? 'اطلاعات موکل ذخیره شد.' : 'موکل با موفقیت افزوده شد.'
      )
      onOpenChange(false)
      form.reset()
    } finally {
      setSubmitting(false)
    }
  }

  const formId = isUpdate ? 'update-client-form' : 'create-client-form'

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) form.reset()
      }}
    >
      <SheetContent className='flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg'>
        <SheetHeader className='border-b px-4 py-4 text-start'>
          <SheetTitle>{isUpdate ? 'ویرایش موکل' : 'افزودن موکل'}</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'اطلاعات تماس و مشخصات موکل را بروزرسانی کنید. تغییرات در همه پرونده‌های مرتبط دیده می‌شود.'
              : 'نام و شماره موبایل الزامی است. بقیه اطلاعات را می‌توانید بعداً تکمیل کنید.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            id={formId}
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-5 overflow-y-auto px-4 py-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    نام و نام خانوادگی{' '}
                    <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='مثلاً علی رضایی' {...field} />
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
                  <FormLabel>
                    شماره موبایل <span className='text-destructive'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='۰۹۱۲۱۲۳۴۵۶۷'
                      inputMode='tel'
                      dir='ltr'
                      className='text-start'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ایمیل</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='name@example.com'
                      dir='ltr'
                      className='text-start'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='nationalId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>کد ملی</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='۱۰ رقم'
                      inputMode='numeric'
                      dir='ltr'
                      className='text-start'
                      maxLength={10}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>توضیحات</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='یادداشت داخلی وکیل درباره این موکل...'
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter className='gap-2 border-t px-4 py-4 sm:flex-row'>
          <Button
            type='button'
            variant='outline'
            className='w-full sm:w-auto'
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>
          <Button
            type='submit'
            form={formId}
            className='w-full sm:w-auto'
            disabled={submitting}
          >
            {submitting
              ? 'در حال ذخیره...'
              : isUpdate
                ? 'ذخیره تغییرات'
                : 'افزودن موکل'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
