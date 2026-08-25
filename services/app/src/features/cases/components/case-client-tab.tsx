'use client'

import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, UserPlus, UserRound, Users } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SelectDropdown } from '@/components/select-dropdown'
import type { Case, Client } from '../types'
import { useCasesStore } from '../stores/cases-store'

type CaseClientTabProps = {
  caseItem: Case
  client: Client | null
}

const editSchema = z.object({
  name: z.string().min(1, 'نام موکل الزامی است.'),
  phone: z.string().min(1, 'شماره موبایل الزامی است.'),
  email: z.union([z.string().email('ایمیل معتبر نیست.'), z.literal('')]).optional(),
  notes: z.string().optional(),
})

type EditValues = z.infer<typeof editSchema>

const changeSchema = z
  .object({
    mode: z.enum(['existing', 'new']),
    clientId: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'existing' && !data.clientId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'یک موکل انتخاب کنید.',
        path: ['clientId'],
      })
    }
    if (data.mode === 'new') {
      if (!data.name?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'نام موکل الزامی است.',
          path: ['name'],
        })
      }
      if (!data.phone?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'شماره موبایل الزامی است.',
          path: ['phone'],
        })
      }
    }
  })

type ChangeValues = z.infer<typeof changeSchema>

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-baseline sm:gap-4'>
      <dt className='text-sm text-muted-foreground'>{label}</dt>
      <dd className='text-sm font-medium whitespace-pre-wrap'>{value || '—'}</dd>
    </div>
  )
}

export function CaseClientTab({ caseItem, client }: CaseClientTabProps) {
  const clients = useCasesStore((state) => state.clients)
  const updateClient = useCasesStore((state) => state.updateClient)
  const addClient = useCasesStore((state) => state.addClient)
  const updateCase = useCasesStore((state) => state.updateCase)

  const [editOpen, setEditOpen] = useState(false)
  const [changeOpen, setChangeOpen] = useState(false)

  const otherClients = useMemo(
    () => clients.filter((item) => item.id !== client?.id),
    [clients, client?.id]
  )

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      notes: '',
    },
  })

  const changeForm = useForm<ChangeValues>({
    resolver: zodResolver(changeSchema),
    defaultValues: {
      mode: otherClients.length > 0 ? 'existing' : 'new',
      clientId: '',
      name: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (editOpen && client) {
      editForm.reset({
        name: client.name,
        phone: client.phone,
        email: client.email ?? '',
        notes: client.notes ?? '',
      })
    }
  }, [editOpen, client, editForm])

  useEffect(() => {
    if (changeOpen) {
      changeForm.reset({
        mode: otherClients.length > 0 ? 'existing' : 'new',
        clientId: '',
        name: '',
        phone: '',
      })
    }
  }, [changeOpen, otherClients.length, changeForm])

  const changeMode = changeForm.watch('mode')

  function onEditSubmit(values: EditValues) {
    if (!client) return

    const result = updateClient(client.id, {
      name: values.name,
      phone: values.phone,
      email: values.email,
      notes: values.notes,
    })

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success('اطلاعات موکل ذخیره شد.')
    setEditOpen(false)
  }

  function onChangeSubmit(values: ChangeValues) {
    let nextClientId: string | null = null

    if (values.mode === 'existing') {
      nextClientId = values.clientId || null
    } else {
      const created = addClient({
        name: values.name!.trim(),
        phone: values.phone!.trim(),
      })
      if (!created.ok) {
        toast.error(created.error)
        return
      }
      nextClientId = created.data.id
    }

    const result = updateCase(caseItem.id, { clientId: nextClientId })
    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success('موکل پرونده به‌روزرسانی شد.')
    setChangeOpen(false)
  }

  if (!client) {
    return (
      <div className='flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center'>
        <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
          <UserRound className='size-5 text-muted-foreground' />
        </div>
        <h3 className='text-base font-semibold tracking-tight'>
          هنوز موکلی به این پرونده متصل نیست
        </h3>
        <p className='mt-2 max-w-sm text-sm text-muted-foreground'>
          یک موکل موجود را انتخاب کنید یا موکل جدید بسازید تا اطلاعات تماس او این‌جا
          نمایش داده شود.
        </p>
        <Button className='mt-6' onClick={() => setChangeOpen(true)}>
          <UserPlus className='size-4' />
          اتصال موکل
        </Button>

        <ChangeClientDialog
          open={changeOpen}
          onOpenChange={setChangeOpen}
          form={changeForm}
          mode={changeMode}
          clients={clients}
          onSubmit={onChangeSubmit}
          title='اتصال موکل'
        />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h3 className='text-base font-semibold tracking-tight'>اطلاعات موکل</h3>
          <p className='text-sm text-muted-foreground'>
            مشخصات موکل مرتبط با این پرونده.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' onClick={() => setEditOpen(true)}>
            <Pencil className='size-4' />
            ویرایش موکل
          </Button>
          <Button variant='outline' onClick={() => setChangeOpen(true)}>
            <Users className='size-4' />
            تغییر موکل
          </Button>
        </div>
      </div>

      <dl className='space-y-3 rounded-lg border p-4 sm:p-5'>
        <InfoRow label='نام' value={client.name} />
        <InfoRow label='شماره موبایل' value={client.phone} />
        <InfoRow label='ایمیل' value={client.email ?? ''} />
        <InfoRow label='اطلاعات تکمیلی' value={client.notes ?? ''} />
      </dl>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-start'>
            <DialogTitle>ویرایش موکل</DialogTitle>
            <DialogDescription>
              تغییرات روی موجودیت موکل اعمال می‌شود و در همه پرونده‌های مرتبط دیده
              خواهد شد.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              id='edit-client-form'
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className='space-y-4'
            >
              <FormField
                control={editForm.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>موبایل</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ایمیل</FormLabel>
                    <FormControl>
                      <Input type='email' placeholder='اختیاری' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name='notes'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اطلاعات تکمیلی</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder='اختیاری' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter className='gap-2 sm:flex-row'>
            <Button variant='outline' onClick={() => setEditOpen(false)}>
              انصراف
            </Button>
            <Button type='submit' form='edit-client-form'>
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChangeClientDialog
        open={changeOpen}
        onOpenChange={setChangeOpen}
        form={changeForm}
        mode={changeMode}
        clients={otherClients.length > 0 ? otherClients : clients}
        onSubmit={onChangeSubmit}
        title='تغییر موکل پرونده'
      />
    </div>
  )
}

type ChangeClientDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: ReturnType<typeof useForm<ChangeValues>>
  mode: 'existing' | 'new'
  clients: Client[]
  onSubmit: (values: ChangeValues) => void
  title: string
}

function ChangeClientDialog({
  open,
  onOpenChange,
  form,
  mode,
  clients,
  onSubmit,
  title,
}: ChangeClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            موکل موجود را انتخاب کنید یا موکل جدیدی بسازید.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='change-client-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='mode'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نحوه انتخاب</FormLabel>
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
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'existing' ? (
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
                      placeholder='انتخاب کنید'
                      items={clients.map((item) => ({
                        label: `${item.name} — ${item.phone}`,
                        value: item.id,
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <>
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>موبایل</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </form>
        </Form>
        <DialogFooter className='gap-2 sm:flex-row'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button type='submit' form='change-client-form'>
            تأیید
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
