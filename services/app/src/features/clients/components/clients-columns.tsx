'use client'

import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Case, Client } from '@/features/cases/types'
import {
  clientHasActiveCase,
  getClientCaseCount,
} from '@/features/cases/utils/clients'
import { formatDate } from '@/features/cases/utils/format'
import { ClientsRowActions } from './clients-row-actions'

export type ClientActivity = 'with_active_case' | 'without_active_case'

export type ClientTableRow = Client & {
  caseCount: number
  attachmentCount: number
  activity: ClientActivity
  hasActiveCase: boolean
}

export function getClientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

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
    cell: ({ row }) => {
      const client = row.original
      return (
        <Link
          href={`/admin/clients/${client.id}`}
          className='flex min-w-0 items-center gap-3 hover:underline'
        >
          <Avatar className='size-8 shrink-0'>
            <AvatarFallback className='text-xs'>
              {getClientInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          <LongText className='max-w-44 font-medium'>{client.name}</LongText>
        </Link>
      )
    },
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='موبایل' />
    ),
    cell: ({ row }) => (
      <span className='tabular-nums text-sm' dir='ltr'>
        {row.original.phone}
      </span>
    ),
    meta: { className: 'w-32' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='ایمیل' />
    ),
    cell: ({ row }) => (
      <span className='text-sm text-muted-foreground'>
        {row.original.email || '—'}
      </span>
    ),
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
    meta: { className: 'w-24' },
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
    meta: { className: 'w-20' },
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
    cell: ({ row }) => <ClientsRowActions row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
]
