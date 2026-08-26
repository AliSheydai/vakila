import * as XLSX from 'xlsx'
import {
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/features/cases/types'
import type { FinancialExportPayload, FinancialTransaction } from '../types'
import {
  FINANCIAL_KIND_LABELS,
  FINANCIAL_PAYMENT_STATUS_LABELS,
  formatFinancialRangeLabel,
  formatTaxRatePercent,
} from '../utils/format'

function toLatinDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (digit) =>
    String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
  )
}

/** Filename-safe Jalali YMD, e.g. 1404-06-01 */
export function formatJalaliYmdForFilename(date: Date): string {
  const parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = toLatinDigits(
    parts.find((part) => part.type === 'year')?.value ?? ''
  )
  const month = toLatinDigits(
    parts.find((part) => part.type === 'month')?.value ?? ''
  ).padStart(2, '0')
  const day = toLatinDigits(
    parts.find((part) => part.type === 'day')?.value ?? ''
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function buildFinancialExportFilename(
  from: Date,
  to: Date
): string {
  return `vakila-financial-${formatJalaliYmdForFilename(from)}_${formatJalaliYmdForFilename(to)}.xlsx`
}

function metaLabel(row: FinancialTransaction): string {
  if (row.kind === 'payment') {
    const status = row.status
      ? FINANCIAL_PAYMENT_STATUS_LABELS[row.status]
      : ''
    const method = row.method ? PAYMENT_METHOD_LABELS[row.method] : ''
    return [status, method].filter(Boolean).join(' / ')
  }
  return row.category ? EXPENSE_CATEGORY_LABELS[row.category] : ''
}

function buildTransactionsSheet(rows: FinancialTransaction[]) {
  const data = rows.map((row) => ({
    تاریخ: row.date.slice(0, 10),
    نوع: FINANCIAL_KIND_LABELS[row.kind],
    مبلغ: row.amount,
    مالیات: row.taxAmount,
    خالص: row.netAmount,
    وضعیت: row.status
      ? FINANCIAL_PAYMENT_STATUS_LABELS[row.status]
      : '',
    'روش/دسته': metaLabel(row),
    'شماره پرونده': row.caseNumber,
    'عنوان پرونده': row.caseTitle,
    موکل: row.clientName ?? '',
    توضیحات: row.description ?? '',
  }))

  return XLSX.utils.json_to_sheet(
    data.length > 0
      ? data
      : [
          {
            تاریخ: '',
            نوع: '',
            مبلغ: '',
            مالیات: '',
            خالص: '',
            وضعیت: '',
            'روش/دسته': '',
            'شماره پرونده': '',
            'عنوان پرونده': '',
            موکل: '',
            توضیحات: '',
          },
        ]
  )
}

function buildSummarySheet(payload: FinancialExportPayload) {
  const { summary, range, taxConfig, transactions, generatedAt } = payload
  const paymentCount = transactions.filter((row) => row.kind === 'payment')
    .length
  const expenseCount = transactions.filter((row) => row.kind === 'expense')
    .length

  const rows: Array<{ مورد: string; مقدار: string | number }> = [
    {
      مورد: 'بازه زمانی',
      مقدار: formatFinancialRangeLabel(range.from, range.to),
    },
    { مورد: 'درآمد ناخالص', مقدار: summary.grossRevenue },
    { مورد: 'مالیات محاسبه‌شده', مقدار: summary.taxTotal },
    { مورد: 'درآمد خالص', مقدار: summary.netRevenue },
    { مورد: 'هزینه‌ها', مقدار: summary.expensesTotal },
    { مورد: 'سود', مقدار: summary.profit },
    { مورد: 'طلب فعلی موکلین', مقدار: summary.receivables },
    { مورد: 'تعداد دریافت‌ها (فیلتر فعلی)', مقدار: paymentCount },
    { مورد: 'تعداد هزینه‌ها (فیلتر فعلی)', مقدار: expenseCount },
    {
      مورد: 'تعداد ردیف‌های Export',
      مقدار: transactions.length,
    },
    {
      مورد: 'نرخ مالیات',
      مقدار: formatTaxRatePercent(taxConfig.rate),
    },
    {
      مورد: 'توضیح مالیات',
      مقدار: taxConfig.label,
    },
    { مورد: 'زمان تولید گزارش', مقدار: generatedAt },
  ]

  return XLSX.utils.json_to_sheet(rows)
}

/**
 * Builds an .xlsx workbook from the current filtered financial payload
 * and triggers a browser download. Numbers stay numeric for Excel formulas.
 */
export function downloadFinancialExcel(
  payload: FinancialExportPayload
): { filename: string; rowCount: number } {
  const workbook = XLSX.utils.book_new()
  const transactionsSheet = buildTransactionsSheet(payload.transactions)
  const summarySheet = buildSummarySheet(payload)

  XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'تراکنش‌ها')
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'خلاصه')

  const filename = buildFinancialExportFilename(
    payload.range.from,
    payload.range.to
  )

  XLSX.writeFile(workbook, filename)

  return {
    filename,
    rowCount: payload.transactions.length,
  }
}
