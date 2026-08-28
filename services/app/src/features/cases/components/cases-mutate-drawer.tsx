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
import { SelectDropdown } from '@/components/select-dropdown'
import {
  formatIranianMobileLocal,
  isValidIranianMobile,
} from '@/lib/iranian-phone'
import {
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  LEGAL_AREAS,
  LEGAL_AREA_LABELS,
  type Case,
} from '../types'
import { useCasesStore } from '../stores/cases-store'

const formSchema = z
  .object({
    title: z.string().min(1, 'عنوان پرونده الزامی است.'),
    caseNumber: z.string().min(1, 'شماره پرونده الزامی است.'),
    legalArea: z.enum(LEGAL_AREAS, {
      required_error: 'حوزه حقوقی را انتخاب کنید.',
    }),
    status: z.enum(CASE_STATUSES),
    description: z.string().optional(),
    clientMode: z.enum(['existing', 'new', 'none']),
    clientId: z.string().optional(),
    clientName: z.string().optional(),
    clientPhone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.clientMode === 'existing' && !data.clientId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'یک موکل انتخاب کنید.',
        path: ['clientId'],
      })
    }
    if (data.clientMode === 'new') {
      if (!data.clientName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'نام موکل الزامی است.',
          path: ['clientName'],
        })
      }
      const phone = data.clientPhone?.trim() ?? ''
      if (!phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'شماره موبایل موکل الزامی است.',
          path: ['clientPhone'],
        })
      } else if (!isValidIranianMobile(phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'شماره موبایل معتبر نیست. مثلاً ۰۹۱۲۱۲۳۴۵۶۷',
          path: ['clientPhone'],
        })
      }
    }
  })

type FormValues = z.infer<typeof formSchema>

type CasesMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Case | null
}

function getDefaultValues(
  clientsCount: number,
  currentRow?: Case | null
): FormValues {
  if (currentRow) {
    return {
      title: currentRow.title,
      caseNumber: currentRow.caseNumber,
      legalArea: currentRow.legalArea,
      status: currentRow.status,
      description: currentRow.description ?? '',
      clientMode: currentRow.clientId ? 'existing' : 'none',
      clientId: currentRow.clientId ?? '',
      clientName: '',
      clientPhone: '',
    }
  }

  return {
    title: '',
    caseNumber: '',
    legalArea: 'civil',
    status: 'new',
    description: '',
    clientMode: clientsCount > 0 ? 'existing' : 'new',
    clientId: '',
    clientName: '',
    clientPhone: '',
  }
}

export function CasesMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: CasesMutateDrawerProps) {
  const isUpdate = !!currentRow
  const clients = useCasesStore((state) => state.clients)
  const addClient = useCasesStore((state) => state.addClient)
  const addCase = useCasesStore((state) => state.addCase)
  const updateCase = useCasesStore((state) => state.updateCase)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(clients.length, currentRow),
  })

  const clientMode = form.watch('clientMode')

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(clients.length, currentRow))
    }
  }, [open, currentRow, clients.length, form])

  async function onSubmit(values: FormValues) {
    setSubmitting(true)

    try {
      let clientId: string | null = null

      if (values.clientMode === 'existing') {
        clientId = values.clientId || null
      } else if (values.clientMode === 'new') {
        const clientResult = await addClient({
          name: values.clientName!.trim(),
          phone: formatIranianMobileLocal(values.clientPhone!.trim()),
        })
        if (!clientResult.ok) {
          toast.error(clientResult.error)
          return
        }
        clientId = clientResult.data.id
      }

      const payload = {
        title: values.title,
        caseNumber: values.caseNumber,
        legalArea: values.legalArea,
        status: values.status,
        description: values.description,
        clientId,
      }

      const result = isUpdate
        ? await updateCase(currentRow.id, payload)
        : await addCase(payload)

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(
        isUpdate ? 'پرونده با موفقیت ویرایش شد.' : 'پرونده با موفقیت ایجاد شد.'
      )
      onOpenChange(false)
      form.reset()
    } finally {
      setSubmitting(false)
    }
  }

  const formId = isUpdate ? 'update-case-form' : 'create-case-form'

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
          <SheetTitle>
            {isUpdate ? 'ویرایش پرونده' : 'ایجاد پرونده'}
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'اطلاعات پرونده را بروزرسانی کنید و ذخیره را بزنید.'
              : 'اطلاعات اولیه پرونده و موکل را وارد کنید. جزئیات مالی و مدارک را می‌توانید بعداً تکمیل کنید.'}
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
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان پرونده</FormLabel>
                  <FormControl>
                    <Input placeholder='مثلاً دعوای خلع ید' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='caseNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شماره پرونده</FormLabel>
                  <FormControl>
                    <Input placeholder='مثلاً ۱۴۰۴-۰۰۱' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='legalArea'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حوزه حقوقی</FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='انتخاب کنید'
                      items={LEGAL_AREAS.map((area) => ({
                        label: LEGAL_AREA_LABELS[area],
                        value: area,
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وضعیت</FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='انتخاب کنید'
                      items={CASE_STATUSES.map((status) => ({
                        label: CASE_STATUS_LABELS[status],
                        value: status,
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='clientMode'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>موکل</FormLabel>
                  <SelectDropdown
                    isControlled
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    items={[
                      ...(clients.length > 0
                        ? [
                            {
                              label: 'انتخاب از موکل‌های موجود',
                              value: 'existing',
                            },
                          ]
                        : []),
                      { label: 'ایجاد موکل جدید', value: 'new' },
                      { label: 'بدون موکل (فعلاً)', value: 'none' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {clientMode === 'existing' ? (
              <FormField
                control={form.control}
                name='clientId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>موکل موجود</FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='موکل را انتخاب کنید'
                      items={clients.map((client) => ({
                        label: `${client.name} — ${client.phone}`,
                        value: client.id,
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {clientMode === 'new' ? (
              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='clientName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام موکل</FormLabel>
                      <FormControl>
                        <Input placeholder='نام و نام خانوادگی' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='clientPhone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>موبایل</FormLabel>
                      <FormControl>
                        <Input
                          type='tel'
                          inputMode='tel'
                          dir='ltr'
                          placeholder='09xxxxxxxxx'
                          autoComplete='tel'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>شرح پرونده</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder='شرح کوتاه یا کامل پرونده را بنویسید...'
                      className='min-h-32 resize-y'
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
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            انصراف
          </Button>
          <Button
            type='submit'
            form={formId}
            disabled={submitting}
            className='w-full sm:w-auto'
          >
            {submitting
              ? 'در حال ذخیره...'
              : isUpdate
                ? 'ذخیره تغییرات'
                : 'ایجاد پرونده'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
