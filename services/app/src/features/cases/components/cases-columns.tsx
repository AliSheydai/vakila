'use client'

import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import type { Case, Client } from '../types'
import { LEGAL_AREA_LABELS } from '../types'
import { getCaseFinancialSummary } from '../utils/finance'
import { formatDate, formatMoneyCompact } from '../utils/format'
import { CaseStatusBadge } from './case-status-badge'
import { DataTableRowActions } from './data-table-row-actions'

export type CaseTableRow = Case & {
  clientName: string
}

export function buildCaseTableRows(
  cases: Case[],
  clients: Client[]
): CaseTableRow[] {
  const clientMap = new Map(clients.map((client) => [client.id, client.name]))

  return cases.map((item) => ({
    ...item,
    clientName: item.clientId
      ? (clientMap.get(item.clientId) ?? 'موکل حذف‌شده')
      : '—',
  }))
}

export const casesColumns: ColumnDef<CaseTableRow>[] = [
  {
    accessorKey: 'caseNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='شماره' />
    ),
    cell: ({ row }) => (
      <Link
        href={`/admin/cases/${row.original.id}`}
        className='font-medium tabular-nums hover:underline'
      >
        {row.getValue('caseNumber')}
      </Link>
    ),
    meta: { className: 'w-28' },
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='عنوان' />
    ),
    cell: ({ row }) => (
      <Link
        href={`/admin/cases/${row.original.id}`}
        className='block hover:underline'
      >
        <LongText className='max-w-56'>{row.getValue('title')}</LongText>
      </Link>
    ),
  },
  {
    accessorKey: 'clientName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='موکل' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>{row.getValue('clientName')}</LongText>
    ),
  },
  {
    accessorKey: 'legalArea',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='نوع' />
    ),
    cell: ({ row }) => (
      <span className='text-sm text-muted-foreground'>
        {LEGAL_AREA_LABELS[row.original.legalArea]}
      </span>
    ),
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='وضعیت' />
    ),
    cell: ({ row }) => <CaseStatusBadge status={row.original.status} />,
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: 'fee',
    accessorFn: (row) => getCaseFinancialSummary(row).totalFee,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='حق‌الزحمه' />
    ),
    cell: ({ row }) => {
      const { totalFee } = getCaseFinancialSummary(row.original)
      return (
        <span className='tabular-nums text-sm'>
          {totalFee > 0 ? formatMoneyCompact(totalFee) : '—'}
        </span>
      )
    },
  },
  {
    id: 'paid',
    accessorFn: (row) => getCaseFinancialSummary(row).totalPaid,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='پرداخت‌شده' />
    ),
    cell: ({ row }) => {
      const { totalPaid } = getCaseFinancialSummary(row.original)
      return (
        <span className='tabular-nums text-sm'>
          {totalPaid > 0 ? formatMoneyCompact(totalPaid) : '—'}
        </span>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: () => null,
    cell: () => null,
    enableHiding: true,
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='آخرین تغییر' />
    ),
    cell: ({ row }) => (
      <span className='text-sm text-muted-foreground'>
        {formatDate(row.original.updatedAt)}
      </span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
]
