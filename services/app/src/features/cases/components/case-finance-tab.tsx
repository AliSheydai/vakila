'use client'

import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  CASE_PAYMENT_STATUS_LABELS,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type Case,
  type CasePaymentStatus,
  type Expense,
  type Payment,
} from '../types'
import { getCaseFinancialSummary } from '../utils/finance'
import { formatDate, formatMoney } from '../utils/format'
import { useCasesStore } from '../stores/cases-store'

type CaseFinanceTabProps = {
  caseItem: Case
}

const paymentStatusStyles: Record<CasePaymentStatus, string> = {
  unpaid:
    'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20',
  partial:
    'bg-amber-100/50 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800',
  paid: 'bg-teal-100/50 text-teal-900 border-teal-200 dark:bg-teal-900/30 dark:text-teal-100 dark:border-teal-800',
}

const feeSchema = z.object({
  amount: z.coerce.number().positive('مبلغ باید بزرگ‌تر از صفر باشد.'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
})

type FeeValues = z.infer<typeof feeSchema>

const paymentSchema = z.object({
  amount: z.coerce.number().positive('مبلغ باید بزرگ‌تر از صفر باشد.'),
  date: z.string().min(1, 'تاریخ الزامی است.'),
  method: z.enum(PAYMENT_METHODS),
  description: z.string().optional(),
})

type PaymentValues = z.infer<typeof paymentSchema>

const expenseSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است.'),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive('مبلغ باید بزرگ‌تر از صفر باشد.'),
  date: z.string().min(1, 'تاریخ الزامی است.'),
  description: z.string().optional(),
})

type ExpenseValues = z.infer<typeof expenseSchema>

function toDateInputValue(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function dateInputToIso(dateValue: string): string {
  // ذخیره به‌صورت ISO در نیمه‌شب UTC برای یکنواختی
  return new Date(`${dateValue}T12:00:00.000Z`).toISOString()
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

export function CaseFinanceTab({ caseItem }: CaseFinanceTabProps) {
  const summary = useMemo(
    () => getCaseFinancialSummary(caseItem),
    [caseItem]
  )

  const upsertFee = useCasesStore((state) => state.upsertFee)
  const addPayment = useCasesStore((state) => state.addPayment)
  const deletePayment = useCasesStore((state) => state.deletePayment)
  const addExpense = useCasesStore((state) => state.addExpense)
  const deleteExpense = useCasesStore((state) => state.deleteExpense)

  const [feeOpen, setFeeOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)

  const feeForm = useForm<FeeValues>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      amount: caseItem.fee?.amount ?? 0,
      description: caseItem.fee?.description ?? '',
      dueDate: toDateInputValue(caseItem.fee?.dueDate),
    },
  })

  const paymentForm = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      date: todayInputValue(),
      method: 'transfer',
      description: '',
    },
  })

  const expenseForm = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      category: 'court',
      amount: 0,
      date: todayInputValue(),
      description: '',
    },
  })

  function openFeeDialog() {
    feeForm.reset({
      amount: caseItem.fee?.amount ?? 0,
      description: caseItem.fee?.description ?? '',
      dueDate: toDateInputValue(caseItem.fee?.dueDate),
    })
    setFeeOpen(true)
  }

  function onFeeSubmit(values: FeeValues) {
    const result = upsertFee(caseItem.id, {
      amount: values.amount,
      description: values.description,
      dueDate: values.dueDate ? dateInputToIso(values.dueDate) : null,
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('حق‌الزحمه ذخیره شد.')
    setFeeOpen(false)
  }

  function onPaymentSubmit(values: PaymentValues) {
    const result = addPayment(caseItem.id, {
      amount: values.amount,
      date: dateInputToIso(values.date),
      method: values.method,
      description: values.description,
      source: 'manual',
      status: 'completed',
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('پرداخت ثبت شد.')
    setPaymentOpen(false)
    paymentForm.reset({
      amount: 0,
      date: todayInputValue(),
      method: 'transfer',
      description: '',
    })
  }

  function onExpenseSubmit(values: ExpenseValues) {
    const result = addExpense(caseItem.id, {
      title: values.title,
      category: values.category,
      amount: values.amount,
      date: dateInputToIso(values.date),
      description: values.description,
    })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('هزینه ثبت شد.')
    setExpenseOpen(false)
    expenseForm.reset({
      title: '',
      category: 'court',
      amount: 0,
      date: todayInputValue(),
      description: '',
    })
  }

  const sortedPayments = useMemo(
    () =>
      [...caseItem.payments].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [caseItem.payments]
  )

  const sortedExpenses = useMemo(
    () =>
      [...caseItem.expenses].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [caseItem.expenses]
  )

  return (
    <div className='space-y-8'>
      <section className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h3 className='text-base font-semibold tracking-tight'>
              خلاصه مالی
            </h3>
            <p className='text-sm text-muted-foreground'>
              مقادیر محاسبه‌شده از حق‌الزحمه، پرداخت‌ها و هزینه‌ها.
            </p>
          </div>
          <Badge
            variant='outline'
            className={cn(paymentStatusStyles[summary.paymentStatus])}
          >
            {CASE_PAYMENT_STATUS_LABELS[summary.paymentStatus]}
          </Badge>
        </div>

        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          {[
            { label: 'حق‌الزحمه کل', value: summary.totalFee },
            { label: 'پرداخت‌شده', value: summary.totalPaid },
            { label: 'باقی‌مانده', value: summary.remaining },
            { label: 'هزینه‌های پرونده', value: summary.totalExpenses },
          ].map((item) => (
            <div
              key={item.label}
              className='rounded-lg border bg-background/60 px-4 py-3'
            >
              <p className='text-xs text-muted-foreground'>{item.label}</p>
              <p className='mt-1 text-base font-semibold tracking-tight tabular-nums sm:text-lg'>
                {formatMoney(item.value)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* حق‌الزحمه */}
      <section className='space-y-4'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h3 className='text-base font-semibold tracking-tight'>
              حق‌الزحمه
            </h3>
            <p className='text-sm text-muted-foreground'>
              مبلغ توافق‌شده برای خدمات حقوقی این پرونده.
            </p>
          </div>
          <Button variant='outline' size='sm' onClick={openFeeDialog}>
            <Pencil className='size-4' />
            {caseItem.fee ? 'ویرایش حق‌الزحمه' : 'ثبت حق‌الزحمه'}
          </Button>
        </div>

        {caseItem.fee ? (
          <dl className='space-y-3 rounded-lg border p-4 sm:p-5'>
            <div className='grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4'>
              <dt className='text-sm text-muted-foreground'>مبلغ</dt>
              <dd className='text-sm font-medium tabular-nums'>
                {formatMoney(caseItem.fee.amount)}
              </dd>
            </div>
            <div className='grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4'>
              <dt className='text-sm text-muted-foreground'>توضیح</dt>
              <dd className='text-sm font-medium'>
                {caseItem.fee.description || '—'}
              </dd>
            </div>
            <div className='grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4'>
              <dt className='text-sm text-muted-foreground'>موعد</dt>
              <dd className='text-sm font-medium'>
                {caseItem.fee.dueDate
                  ? formatDate(caseItem.fee.dueDate)
                  : '—'}
              </dd>
            </div>
          </dl>
        ) : (
          <div className='rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground'>
            هنوز حق‌الزحمه ثبت نشده است.
          </div>
        )}
      </section>

      {/* پرداخت‌ها */}
      <section className='space-y-4'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h3 className='text-base font-semibold tracking-tight'>پرداخت‌ها</h3>
            <p className='text-sm text-muted-foreground'>
              پرداخت‌های دستی موکل. ساختار آماده اتصال پرداخت آنلاین است.
            </p>
          </div>
          <Button
            size='sm'
            onClick={() => {
              paymentForm.reset({
                amount: 0,
                date: todayInputValue(),
                method: 'transfer',
                description: '',
              })
              setPaymentOpen(true)
            }}
          >
            <Plus className='size-4' />
            ثبت پرداخت
          </Button>
        </div>

        {sortedPayments.length === 0 ? (
          <div className='rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground'>
            پرداختی ثبت نشده است.
          </div>
        ) : (
          <ul className='divide-y rounded-lg border'>
            {sortedPayments.map((payment) => (
              <li
                key={payment.id}
                className='flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
              >
                <div className='min-w-0'>
                  <p className='text-sm font-medium tabular-nums'>
                    {formatMoney(payment.amount)}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {formatDate(payment.date)} ·{' '}
                    {PAYMENT_METHOD_LABELS[payment.method]}
                    {payment.description ? ` · ${payment.description}` : ''}
                  </p>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 self-start text-destructive hover:text-destructive sm:self-center'
                  onClick={() => setPaymentToDelete(payment)}
                >
                  <Trash2 className='size-4' />
                  حذف
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* هزینه‌ها */}
      <section className='space-y-4'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h3 className='text-base font-semibold tracking-tight'>هزینه‌ها</h3>
            <p className='text-sm text-muted-foreground'>
              هزینه‌های مرتبط با پرونده مانند دادرسی و کارشناسی.
            </p>
          </div>
          <Button
            size='sm'
            onClick={() => {
              expenseForm.reset({
                title: '',
                category: 'court',
                amount: 0,
                date: todayInputValue(),
                description: '',
              })
              setExpenseOpen(true)
            }}
          >
            <Plus className='size-4' />
            ثبت هزینه
          </Button>
        </div>

        {sortedExpenses.length === 0 ? (
          <div className='rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground'>
            هزینه‌ای ثبت نشده است.
          </div>
        ) : (
          <ul className='divide-y rounded-lg border'>
            {sortedExpenses.map((expense) => (
              <li
                key={expense.id}
                className='flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
              >
                <div className='min-w-0'>
                  <p className='text-sm font-medium'>{expense.title}</p>
                  <p className='text-xs text-muted-foreground'>
                    {EXPENSE_CATEGORY_LABELS[expense.category]} ·{' '}
                    {formatMoney(expense.amount)} · {formatDate(expense.date)}
                    {expense.description ? ` · ${expense.description}` : ''}
                  </p>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 self-start text-destructive hover:text-destructive sm:self-center'
                  onClick={() => setExpenseToDelete(expense)}
                >
                  <Trash2 className='size-4' />
                  حذف
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Dialog حق‌الزحمه */}
      <Dialog open={feeOpen} onOpenChange={setFeeOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {caseItem.fee ? 'ویرایش حق‌الزحمه' : 'ثبت حق‌الزحمه'}
            </DialogTitle>
            <DialogDescription>
              مبلغ توافق‌شده را وارد کنید. در آینده می‌توان پرداخت مرحله‌ای اضافه
              کرد.
            </DialogDescription>
          </DialogHeader>
          <Form {...feeForm}>
            <form
              id='fee-form'
              onSubmit={feeForm.handleSubmit(onFeeSubmit)}
              className='space-y-4'
            >
              <FormField
                control={feeForm.control}
                name='amount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مبلغ (ریال)</FormLabel>
                    <FormControl>
                      <Input type='number' min={0} step={1000} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={feeForm.control}
                name='dueDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>موعد (اختیاری)</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={feeForm.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیح</FormLabel>
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
            <Button variant='outline' onClick={() => setFeeOpen(false)}>
              انصراف
            </Button>
            <Button type='submit' form='fee-form'>
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog پرداخت */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-start'>
            <DialogTitle>ثبت پرداخت</DialogTitle>
            <DialogDescription>
              پرداخت دستی را ثبت کنید. فیلد source برای اتصال آینده به درگاه آماده
              است.
            </DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form
              id='payment-form'
              onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}
              className='space-y-4'
            >
              <FormField
                control={paymentForm.control}
                name='amount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مبلغ (ریال)</FormLabel>
                    <FormControl>
                      <Input type='number' min={0} step={1000} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name='date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name='method'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>روش پرداخت</FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      items={PAYMENT_METHODS.map((method) => ({
                        label: PAYMENT_METHOD_LABELS[method],
                        value: method,
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیح</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder='اختیاری' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter className='gap-2 sm:flex-row'>
            <Button variant='outline' onClick={() => setPaymentOpen(false)}>
              انصراف
            </Button>
            <Button type='submit' form='payment-form'>
              ثبت پرداخت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog هزینه */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='text-start'>
            <DialogTitle>ثبت هزینه</DialogTitle>
            <DialogDescription>
              هزینه مرتبط با پرونده را ثبت کنید.
            </DialogDescription>
          </DialogHeader>
          <Form {...expenseForm}>
            <form
              id='expense-form'
              onSubmit={expenseForm.handleSubmit(onExpenseSubmit)}
              className='space-y-4'
            >
              <FormField
                control={expenseForm.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان</FormLabel>
                    <FormControl>
                      <Input placeholder='مثلاً هزینه کارشناسی' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={expenseForm.control}
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>دسته‌بندی</FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      items={EXPENSE_CATEGORIES.map((category) => ({
                        label: EXPENSE_CATEGORY_LABELS[category],
                        value: category,
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={expenseForm.control}
                name='amount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مبلغ (ریال)</FormLabel>
                    <FormControl>
                      <Input type='number' min={0} step={1000} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={expenseForm.control}
                name='date'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={expenseForm.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیح</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder='اختیاری' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter className='gap-2 sm:flex-row'>
            <Button variant='outline' onClick={() => setExpenseOpen(false)}>
              انصراف
            </Button>
            <Button type='submit' form='expense-form'>
              ثبت هزینه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        destructive
        open={!!paymentToDelete}
        onOpenChange={(open) => {
          if (!open) setPaymentToDelete(null)
        }}
        handleConfirm={() => {
          if (!paymentToDelete) return
          const result = deletePayment(caseItem.id, paymentToDelete.id)
          if (!result.ok) {
            toast.error(result.error)
            return
          }
          toast.success('پرداخت حذف شد.')
          setPaymentToDelete(null)
        }}
        className='max-w-md'
        title='حذف پرداخت'
        desc={
          paymentToDelete ? (
            <>
              پرداخت به مبلغ{' '}
              <strong>{formatMoney(paymentToDelete.amount)}</strong> حذف می‌شود.
            </>
          ) : (
            ''
          )
        }
        confirmText='حذف پرداخت'
      />

      <ConfirmDialog
        destructive
        open={!!expenseToDelete}
        onOpenChange={(open) => {
          if (!open) setExpenseToDelete(null)
        }}
        handleConfirm={() => {
          if (!expenseToDelete) return
          const result = deleteExpense(caseItem.id, expenseToDelete.id)
          if (!result.ok) {
            toast.error(result.error)
            return
          }
          toast.success('هزینه حذف شد.')
          setExpenseToDelete(null)
        }}
        className='max-w-md'
        title='حذف هزینه'
        desc={
          expenseToDelete ? (
            <>
              هزینه «<strong>{expenseToDelete.title}</strong>» حذف می‌شود.
            </>
          ) : (
            ''
          )
        }
        confirmText='حذف هزینه'
      />
    </div>
  )
}
