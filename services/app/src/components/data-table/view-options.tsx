'use client'

import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { MixerHorizontalIcon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type DataTableViewOptionsProps<TData> = {
  table: Table<TData>
  className?: string
}

function columnLabel(column: {
  id: string
  columnDef: { meta?: { label?: string } }
}) {
  return column.columnDef.meta?.label ?? column.id
}

export function DataTableViewOptions<TData>({
  table,
  className,
}: DataTableViewOptionsProps<TData>) {
  const hideableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide()
    )

  const hasHiddenColumns = hideableColumns.some(
    (column) => !column.getIsVisible()
  )

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className={cn('hidden h-8 md:flex', className)}
        >
          <MixerHorizontalIcon className='size-4' />
          نمایش
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuLabel>ستون‌های جدول</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className='gap-2'
            checked={column.getIsVisible()}
            onCheckedChange={(value) => column.toggleVisibility(!!value)}
            onSelect={(event) => event.preventDefault()}
          >
            {columnLabel(column)}
          </DropdownMenuCheckboxItem>
        ))}
        {hasHiddenColumns && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                hideableColumns.forEach((column) =>
                  column.toggleVisibility(true)
                )
              }}
            >
              نمایش همه ستون‌ها
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
