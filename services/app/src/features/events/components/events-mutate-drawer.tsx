'use client'

import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { useCasesStore } from '@/features/cases/stores/cases-store'
import {
  EVENT_STATUSES,
  EVENT_STATUS_LABELS,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  type Event,
} from '../types'
import { useEventsStore } from '../stores/events-store'
import { formatEventDate, toDateKey } from '../utils/datetime'
import { EventsDatePicker } from './events-date-picker'
import { EventsTimePicker } from './events-time-picker'
import type { EventCreateDefaults } from './events-provider'

const NONE = '__none__'

/** HH:mm یا HH:mm:ss از input type=time */
const timeSchema = z
  .string()
  .min(1, 'ساعت الزامی است.')
  .refine(
    (value) => /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value),
    'ساعت را به‌صورت HH:mm وارد کنید.'
  )

function normalizeTime(value: string): string {
  return value.slice(0, 5)
}

const formSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'عنوان رویداد الزامی است.')
      .max(120, 'عنوان نباید بیشتر از ۱۲۰ کاراکتر باشد.'),
    type: z.enum(EVENT_TYPES, {
      required_error: 'نوع رویداد را انتخاب کنید.',
    }),
    date: z
      .string()
      .min(1, 'تاریخ رویداد الزامی است.')
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'تاریخ نامعتبر است.'),
    startTime: timeSchema,
    endTime: timeSchema,
    location: z
      .string()
      .max(200, 'مکان نباید بیشتر از ۲۰۰ کاراکتر باشد.')
      .optional(),
    description: z
      .string()
      .max(2000, 'توضیحات نباید بیشتر از ۲۰۰۰ کاراکتر باشد.')
      .optional(),
    clientId: z.string(),
    caseId: z.string(),
    status: z.enum(EVENT_STATUSES),
  })
  .superRefine((data, ctx) => {
    const start = normalizeTime(data.startTime)
    const end = normalizeTime(data.endTime)
    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ساعت پایان باید بعد از ساعت شروع باشد.',
        path: ['endTime'],
      })
    }
  })

type FormValues = z.infer<typeof formSchema>

type EventsMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Event | null
  createDefaults?: EventCreateDefaults | null
}

function getDefaultValues(
  currentRow?: Event | null,
  createDefaults?: EventCreateDefaults | null
): FormValues {
  if (currentRow) {
    return {
      title: currentRow.title,
      type: currentRow.type,
      date: currentRow.date,
      startTime: currentRow.startTime,
      endTime: currentRow.endTime,
      location: currentRow.location ?? '',
      description: currentRow.description ?? '',
      clientId: currentRow.clientId ?? NONE,
      caseId: currentRow.caseId ?? NONE,
      status: currentRow.status,
    }
  }

  return {
    title: '',
    type: 'client_meeting',
    date: createDefaults?.date ?? toDateKey(new Date()),
    startTime: createDefaults?.startTime ?? '10:00',
    endTime: createDefaults?.endTime ?? '11:00',
    location: '',
    description: '',
    clientId: createDefaults?.clientId || NONE,
    caseId: createDefaults?.caseId || NONE,
    status: 'scheduled',
  }
}

export function EventsMutateDrawer({
  open,
  onOpenChange,
  currentRow,
  createDefaults,
}: EventsMutateDrawerProps) {
  const isUpdate = !!currentRow
  const clients = useCasesStore((state) => state.clients)
  const cases = useCasesStore((state) => state.cases)
  const addEvent = useEventsStore((state) => state.addEvent)
  const updateEvent = useEventsStore((state) => state.updateEvent)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(currentRow, createDefaults),
  })

  const selectedCaseId = form.watch('caseId')
  const selectedClientId = form.watch('clientId')

  const selectedCase = useMemo(
    () =>
      selectedCaseId !== NONE
        ? (cases.find((item) => item.id === selectedCaseId) ?? null)
        : null,
    [cases, selectedCaseId]
  )

  const caseLocksClient = Boolean(selectedCase?.clientId)

  const caseItems = useMemo(() => {
    const filtered =
      selectedClientId !== NONE && !caseLocksClient
        ? cases.filter(
            (item) =>
              item.clientId === null || item.clientId === selectedClientId
          )
        : cases

    return [
      { label: 'بدون پرونده', value: NONE },
      ...filtered.map((item) => ({
        label: `${item.caseNumber} — ${item.title}`,
        value: item.id,
      })),
    ]
  }, [cases, selectedClientId, caseLocksClient])

  const clientItems = useMemo(
    () => [
      { label: 'بدون موکل', value: NONE },
      ...clients.map((item) => ({
        label: item.name,
        value: item.id,
      })),
    ],
    [clients]
  )

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(currentRow, createDefaults))
    }
  }, [open, currentRow, createDefaults, form])

  useEffect(() => {
    if (!open || !selectedCase) return
    if (selectedCase.clientId) {
      const current = form.getValues('clientId')
      if (current !== selectedCase.clientId) {
        form.setValue('clientId', selectedCase.clientId, {
          shouldValidate: true,
        })
      }
    }
  }, [open, selectedCase, form])

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const payload = {
        title: values.title,
        type: values.type,
        date:
          isDateLocked && createDefaults?.date
            ? createDefaults.date
            : values.date,
        startTime: normalizeTime(values.startTime),
        endTime: normalizeTime(values.endTime),
        location: values.location,
        description: values.description,
        clientId: values.clientId === NONE ? null : values.clientId,
        caseId: values.caseId === NONE ? null : values.caseId,
        status: values.status,
      }

      const result = isUpdate
        ? await updateEvent(currentRow.id, payload)
        : await addEvent(payload)

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      toast.success(
        isUpdate ? 'رویداد با موفقیت ویرایش شد.' : 'رویداد با موفقیت ایجاد شد.'
      )
      onOpenChange(false)
      form.reset()
    } finally {
      setSubmitting(false)
    }
  }

  const formId = isUpdate ? 'update-event-form' : 'create-event-form'
  const isDateLocked = !isUpdate && Boolean(createDefaults?.lockDate)

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) form.reset()
      }}
    >
      <SheetContent className='flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg'>
        <SheetHeader className='border-b px-4 py-4 pe-12 text-start'>
          <SheetTitle>
            {isUpdate ? 'ویرایش رویداد' : 'ایجاد رویداد'}
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'جزئیات رویداد را بروزرسانی کنید. تغییرات بلافاصله در تقویم و لیست دیده می‌شود.'
              : 'جلسه، دادگاه، مهلت یا یادآوری جدید ثبت کنید.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto px-4 py-4'>
          <Form {...form}>
            <form
              id={formId}
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان *</FormLabel>
                    <FormControl>
                      <Input placeholder='مثلاً جلسه با موکل' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع رویداد *</FormLabel>
                      <SelectDropdown
                        isControlled
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        items={EVENT_TYPES.map((type) => ({
                          label: EVENT_TYPE_LABELS[type],
                          value: type,
                        }))}
                        placeholder='نوع را انتخاب کنید'
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
                        items={EVENT_STATUSES.map((status) => ({
                          label: EVENT_STATUS_LABELS[status],
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
                name='date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ *</FormLabel>
                    <FormControl>
                      <EventsDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isDateLocked}
                        placeholder='انتخاب تاریخ'
                        aria-label='تاریخ رویداد'
                      />
                    </FormControl>
                    {isDateLocked ? (
                      <FormDescription>
                        تاریخ این رویداد روی{' '}
                        <span className='font-medium text-foreground'>
                          {formatEventDate(field.value)}
                        </span>{' '}
                        قفل شده است چون از تقویم/روز مشخص ایجاد شده.
                      </FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='startTime'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ساعت شروع *</FormLabel>
                      <FormControl>
                        <EventsTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder='انتخاب ساعت شروع'
                          aria-label='ساعت شروع'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='endTime'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ساعت پایان *</FormLabel>
                      <FormControl>
                        <EventsTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder='انتخاب ساعت پایان'
                          aria-label='ساعت پایان'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='location'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مکان</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='دفتر، دادگاه، لینک جلسه آنلاین…'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='caseId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>پرونده</FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        if (value === NONE) return
                        const linked = cases.find((item) => item.id === value)
                        if (linked?.clientId) {
                          form.setValue('clientId', linked.clientId, {
                            shouldValidate: true,
                          })
                        }
                      }}
                      items={caseItems}
                      placeholder='انتخاب پرونده'
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='clientId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>موکل</FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      items={clientItems}
                      placeholder='انتخاب موکل'
                      disabled={caseLocksClient}
                    />
                    {caseLocksClient ? (
                      <FormDescription>
                        موکل از پرونده انتخاب‌شده گرفته شده و قابل تغییر نیست.
                      </FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder='جزئیات جلسه یا یادداشت…'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <SheetFooter className='border-t px-4 py-4'>
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
              ? 'در حال ذخیره…'
              : isUpdate
                ? 'ذخیره تغییرات'
                : 'ایجاد رویداد'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
