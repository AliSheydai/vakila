'use client'

import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { Badge } from '@/components/ui/badge'
import type { Case, Client } from '@/features/cases/types'
import {
  clientHasActiveCase,
  getClientCaseCount,
} from '@/features/cases/utils/clients'
import { formatDate } from '@/features/cases/utils/format'
import { ClientAvatar, getClientInitials } from './client-avatar'
import { ClientsRowActions } from './clients-row-actions'

export type ClientActivity = 'with_active_case' | 'without_active_case'

export type ClientTableRow = Client & {
  caseCount: number
  attachmentCount: number
  activity: ClientActivity
  hasActiveCase: boolean
}

export { getClientInitials }

export function buildClientTableRows(
  clients: Client[],
  cases: Case[]
): ClientTableRow[] {
  return clients.map((client) => {
    const caseCount = getClientCaseCount(cases, client.id)
    const hasActiveCase = clientHasActiveCase(cases, client.id)

    return {
      ...client,
      caseCount,
      attachmentCount: client.attachments?.length ?? 0,
      hasActiveCase,
      activity: hasActiveCase ? 'with_active_case' : 'without_active_case',
    }
  })
}

export const clientsColumns: ColumnDef<ClientTableRow>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='موکل' />
    ),
    sortingFn: (rowA, rowB) =>
      rowA.original.name.localeCompare(rowB.original.name, 'fa'),
    cell: ({ row }) => {
      const client = row.original
      return (
        <Link
          href={`/admin/clients/${client.id}`}
          className='flex min-w-0 items-center gap-3 hover:underline'
        >
          <ClientAvatar
            name={client.name}
            avatarDataUrl={client.avatarDataUrl}
            className='size-8 shrink-0'
            fallbackClassName='text-xs'
          />
          <LongText className='max-w-44 font-medium'>{client.name}</LongText>
        </Link>
      )
    },
    meta: { label: 'موکل' },
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='موبایل' />
    ),
    cell: ({ row }) => (
      <span className='inline-block tabular-nums text-sm' dir='ltr'>
        {row.original.phone}
      </span>
    ),
    meta: { className: 'w-32', label: 'موبایل' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='ایمیل' />
    ),
    cell: ({ row }) => (
      <span
        className='block max-w-40 truncate text-sm text-muted-foreground'
        dir='ltr'
        title={row.original.email || undefined}
      >
        {row.original.email || '—'}
      </span>
    ),
    meta: { label: 'ایمیل' },
  },
  {
    accessorKey: 'caseCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='پرونده‌ها' />
    ),
    cell: ({ row }) => (
      <span className='tabular-nums text-sm'>
        {row.original.caseCount.toLocaleString('fa-IR')}
      </span>
    ),
    meta: { className: 'w-24', label: 'پرونده‌ها' },
  },
  {
    accessorKey: 'attachmentCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='ضمائم' />
    ),
    cell: ({ row }) => (
      <span className='tabular-nums text-sm'>
        {row.original.attachmentCount.toLocaleString('fa-IR')}
      </span>
    ),
    meta: { className: 'w-20', label: 'ضمائم' },
  },
  {
    accessorKey: 'activity',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='وضعیت' />
    ),
    cell: ({ row }) =>
      row.original.hasActiveCase ? (
        <Badge variant='secondary'>پرونده فعال</Badge>
      ) : row.original.caseCount > 0 ? (
        <Badge variant='outline'>بدون پرونده فعال</Badge>
      ) : (
        <Badge variant='outline'>بدون پرونده</Badge>
      ),
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id))
    },
    meta: { label: 'وضعیت' },
  },
  {
    accessorKey: 'createdAt',
    header: () => null,
    cell: () => null,
    enableHiding: false,
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
    meta: { label: 'آخرین تغییر' },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ClientsRowActions row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
]
