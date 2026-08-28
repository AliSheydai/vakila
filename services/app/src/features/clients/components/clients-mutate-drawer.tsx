'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { fileToAvatarDataUrl } from '@/lib/avatar-image'
import {
  formatIranianMobileLocal,
  isValidIranianMobile,
} from '@/lib/iranian-phone'
import {
  isValidForeignId,
  isValidIranianNationalId,
  normalizeForeignId,
  normalizeNationalIdDigits,
} from '@/lib/iranian-national-id'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SelectDropdown } from '@/components/select-dropdown'
import type { Client } from '@/features/cases/types'
import { useCasesStore } from '@/features/cases/stores/cases-store'
import { ClientAvatar } from './client-avatar'

type Citizenship = 'iranian' | 'foreign'

function inferCitizenship(client?: Client | null): Citizenship {
  if (client?.citizenship) return client.citizenship
  const id = client?.nationalId?.trim() ?? ''
  if (!id) return 'iranian'
  if (/^\d{10}$/.test(normalizeNationalIdDigits(id))) return 'iranian'
  return 'foreign'
}

const formSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'نام و نام خانوادگی الزامی است.'),
    phone: z
      .string()
      .trim()
      .min(1, 'شماره موبایل الزامی است.')
      .refine(isValidIranianMobile, {
        message: 'شماره موبایل معتبر نیست. مثلاً ۰۹۱۲۱۲۳۴۵۶۷',
      }),
    email: z.string().trim(),
    citizenship: z.enum(['iranian', 'foreign']),
    nationalId: z.string().trim(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.email && !z.string().email().safeParse(data.email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ایمیل معتبر نیست.',
        path: ['email'],
      })
    }

    if (!data.nationalId) return

    if (data.citizenship === 'iranian') {
      if (!isValidIranianNationalId(data.nationalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'کد ملی ایران معتبر نیست.',
          path: ['nationalId'],
        })
      }
    } else if (!isValidForeignId(data.nationalId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'شناسه اتباع معتبر نیست. بین ۵ تا ۲۰ کاراکتر حروف یا عدد وارد کنید.',
        path: ['nationalId'],
      })
    }
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
      citizenship: inferCitizenship(currentRow),
      nationalId: currentRow.nationalId ?? '',
      notes: currentRow.notes ?? '',
    }
  }

  return {
    name: '',
    phone: '',
    email: '',
    citizenship: 'iranian',
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarProcessing, setAvatarProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputId = useId()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(currentRow),
  })

  const citizenship = form.watch('citizenship')
  const watchedName = form.watch('name')

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(currentRow))
      setAvatarPreview(currentRow?.avatarDataUrl ?? null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [open, currentRow, form])

  async function handleAvatarChange(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return

    setAvatarProcessing(true)
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      setAvatarPreview(dataUrl)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'آپلود تصویر ناموفق بود.'
      )
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setAvatarProcessing(false)
    }
  }

  function clearAvatar() {
    setAvatarPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)

    try {
      const rawId = values.nationalId.trim()
      const nationalId = rawId
        ? values.citizenship === 'iranian'
          ? normalizeNationalIdDigits(rawId)
          : normalizeForeignId(rawId)
        : undefined

      const payload = {
        name: values.name.trim(),
        phone: formatIranianMobileLocal(values.phone),
        email: values.email.trim() || undefined,
        citizenship: values.citizenship,
        nationalId,
        avatarDataUrl: avatarPreview,
        notes: values.notes?.trim() || undefined,
      }

      const result = isUpdate
        ? await updateClient(currentRow.id, payload)
        : await addClient(payload)

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(
        isUpdate ? 'اطلاعات موکل ذخیره شد.' : 'موکل با موفقیت افزوده شد.'
      )
      onOpenChange(false)
      form.reset()
      setAvatarPreview(null)
    } finally {
      setSubmitting(false)
    }
  }

  const formId = isUpdate ? 'update-client-form' : 'create-client-form'
  const idLabel =
    citizenship === 'iranian' ? 'کد ملی' : 'شناسه اتباع / گذرنامه'
  const idPlaceholder =
    citizenship === 'iranian' ? '۱۰ رقم کد ملی' : 'مثلاً A12345678'
  const previewName = watchedName.trim() || 'موکل'

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          form.reset()
          setAvatarPreview(null)
        }
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
            <div className='flex items-center gap-4'>
              <ClientAvatar
                name={previewName}
                avatarDataUrl={avatarPreview}
                className='size-16'
                fallbackClassName='text-lg'
              />
              <div className='min-w-0 flex-1 space-y-2'>
                <p className='text-sm font-medium'>عکس پروفایل</p>
                <p className='text-xs text-muted-foreground'>
                  اختیاری — در لیست موکل‌ها به‌جای حروف اول نمایش داده می‌شود.
                </p>
                <div className='flex flex-wrap gap-2'>
                  <input
                    ref={fileInputRef}
                    id={fileInputId}
                    type='file'
                    accept='image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif'
                    className='sr-only'
                    onChange={(event) => handleAvatarChange(event.target.files)}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={avatarProcessing || submitting}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className='size-4' />
                    {avatarProcessing
                      ? 'در حال پردازش...'
                      : avatarPreview
                        ? 'تغییر عکس'
                        : 'انتخاب عکس'}
                  </Button>
                  {avatarPreview ? (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      disabled={avatarProcessing || submitting}
                      onClick={clearAvatar}
                    >
                      <Trash2 className='size-4' />
                      حذف عکس
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

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
                      type='tel'
                      placeholder='۰۹۱۲۱۲۳۴۵۶۷'
                      inputMode='tel'
                      dir='ltr'
                      autoComplete='tel'
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
                      autoComplete='email'
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
              name='citizenship'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>تابعیت</FormLabel>
                  <SelectDropdown
                    isControlled
                    defaultValue={field.value}
                    onValueChange={(value) => {
                      field.onChange(value as Citizenship)
                      form.clearErrors('nationalId')
                    }}
                    items={[
                      { label: 'اتباع ایرانی', value: 'iranian' },
                      { label: 'اتباع غیر ایرانی', value: 'foreign' },
                    ]}
                  />
                  <FormDescription>
                    نوع شناسه هویتی بر اساس تابعیت تغییر می‌کند.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='nationalId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{idLabel}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={idPlaceholder}
                      inputMode={
                        citizenship === 'iranian' ? 'numeric' : 'text'
                      }
                      dir='ltr'
                      className='text-start'
                      maxLength={citizenship === 'iranian' ? 10 : 20}
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
            disabled={submitting || avatarProcessing}
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
