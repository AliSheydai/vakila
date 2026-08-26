'use client'

import { Search as SearchIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_RECORD_STATUSES,
  type Case,
  type Client,
} from '@/features/cases/types'
import type { FinancialFilters } from '../types'
import { DEFAULT_FINANCIAL_FILTERS } from '../types'
import {
  FINANCIAL_KIND_LABELS,
  FINANCIAL_PAYMENT_STATUS_LABELS,
  formatFinancialNumber,
  hasActiveFinancialFilters,
} from '../utils/format'

type FinancialFiltersProps = {
  filters: FinancialFilters
  cases: Case[]
  clients: Client[]
  resultCount: number
  onChange: (next: FinancialFilters) => void
}

export function FinancialFiltersBar({
  filters,
  cases,
  clients,
  resultCount,
  onChange,
}: FinancialFiltersProps) {
  const active = hasActiveFinancialFilters(filters)
  const paymentOnlyDisabled = filters.kind === 'expense'
  const expenseOnlyDisabled = filters.kind === 'payment'

  const patch = (partial: Partial<FinancialFilters>) => {
    const next = { ...filters, ...partial }

    if (partial.kind === 'expense') {
      next.paymentStatus = 'all'
      next.method = 'all'
    }
    if (partial.kind === 'payment') {
      next.category = 'all'
    }

    onChange(next)
  }

  return (
    <section
      aria-label='فیلتر تراکنش‌ها'
      className='flex w-full flex-col gap-3 rounded-xl border bg-background/60 p-3 sm:p-4'
    >
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <p className='text-sm font-medium'>فیلتر تراکنش‌ها</p>
          <p className='text-xs text-muted-foreground' aria-live='polite'>
            {resultCount === 0
              ? 'نتیجه‌ای یافت نشد'
              : `${formatFinancialNumber(resultCount)} تراکنش`}
          </p>
        </div>
        {active ? (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='self-start sm:self-auto'
            onClick={() => onChange({ ...DEFAULT_FINANCIAL_FILTERS })}
          >
            <X className='size-4' aria-hidden />
            پاک‌کردن فیلترها
          </Button>
        ) : null}
      </div>

      <div className='relative'>
        <SearchIcon
          className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
          aria-hidden
        />
        <Input
          value={filters.query}
          onChange={(event) => patch({ query: event.target.value })}
          placeholder='جستجو در پرونده، شماره، موکل یا توضیحات...'
          className='ps-9'
          aria-label='جستجوی تراکنش‌ها'
          autoComplete='off'
        />
      </div>

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        <FilterSelect
          id='financial-filter-kind'
          label='نوع تراکنش'
          value={filters.kind}
          onValueChange={(value) =>
            patch({ kind: value as FinancialFilters['kind'] })
          }
          options={[
            { value: 'all', label: FINANCIAL_KIND_LABELS.all },
            { value: 'payment', label: FINANCIAL_KIND_LABELS.payment },
            { value: 'expense', label: FINANCIAL_KIND_LABELS.expense },
          ]}
        />

        <FilterSelect
          id='financial-filter-status'
          label='وضعیت پرداخت'
          value={filters.paymentStatus}
          disabled={paymentOnlyDisabled}
          hint={
            paymentOnlyDisabled
              ? 'فقط برای دریافت‌ها'
              : undefined
          }
          onValueChange={(value) =>
            patch({
              paymentStatus: value as FinancialFilters['paymentStatus'],
            })
          }
          options={[
            {
              value: 'all',
              label: FINANCIAL_PAYMENT_STATUS_LABELS.all,
            },
            ...PAYMENT_RECORD_STATUSES.map((status) => ({
              value: status,
              label: FINANCIAL_PAYMENT_STATUS_LABELS[status],
            })),
          ]}
        />

        <FilterSelect
          id='financial-filter-method'
          label='روش پرداخت'
          value={filters.method}
          disabled={paymentOnlyDisabled}
          hint={
            paymentOnlyDisabled
              ? 'فقط برای دریافت‌ها'
              : undefined
          }
          onValueChange={(value) =>
            patch({ method: value as FinancialFilters['method'] })
          }
          options={[
            { value: 'all', label: 'همه روش‌ها' },
            ...PAYMENT_METHODS.map((method) => ({
              value: method,
              label: PAYMENT_METHOD_LABELS[method],
            })),
          ]}
        />

        <FilterSelect
          id='financial-filter-category'
          label='دسته هزینه'
          value={filters.category}
          disabled={expenseOnlyDisabled}
          hint={
            expenseOnlyDisabled
              ? 'فقط برای هزینه‌ها'
              : undefined
          }
          onValueChange={(value) =>
            patch({ category: value as FinancialFilters['category'] })
          }
          options={[
            { value: 'all', label: 'همه دسته‌ها' },
            ...EXPENSE_CATEGORIES.map((category) => ({
              value: category,
              label: EXPENSE_CATEGORY_LABELS[category],
            })),
          ]}
        />

        <FilterSelect
          id='financial-filter-client'
          label='موکل'
          value={filters.clientId}
          onValueChange={(value) => patch({ clientId: value })}
          options={[
            { value: 'all', label: 'همه موکلین' },
            ...clients.map((client) => ({
              value: client.id,
              label: client.name,
            })),
          ]}
        />

        <FilterSelect
          id='financial-filter-case'
          label='پرونده'
          value={filters.caseId}
          onValueChange={(value) => patch({ caseId: value })}
          options={[
            { value: 'all', label: 'همه پرونده‌ها' },
            ...cases.map((caseItem) => ({
              value: caseItem.id,
              label: `${caseItem.caseNumber} — ${caseItem.title}`,
            })),
          ]}
        />
      </div>
    </section>
  )
}

type FilterSelectProps = {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
  hint?: string
}

function FilterSelect({
  id,
  label,
  value,
  onValueChange,
  options,
  disabled = false,
  hint,
}: FilterSelectProps) {
  return (
    <div className='min-w-0'>
      <label
        className='mb-1.5 block text-xs text-muted-foreground'
        htmlFor={id}
      >
        {label}
      </label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className='w-full'
          aria-label={label}
          aria-disabled={disabled}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className='line-clamp-1'>{option.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? (
        <p className='mt-1 text-[11px] text-muted-foreground'>{hint}</p>
      ) : null}
    </div>
  )
}
