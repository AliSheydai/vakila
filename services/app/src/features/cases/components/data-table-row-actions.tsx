'use client'

import Link from 'next/link'
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react'
import { type Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Case } from '../types'
import { useCasesDialogs } from './cases-provider'

type DataTableRowActionsProps = {
  row: Row<Case>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useCasesDialogs()
  const caseItem = row.original

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex size-8 p-0 data-[state=open]:bg-muted'
        >
          <MoreHorizontal className='size-4' />
          <span className='sr-only'>باز کردن منو</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-44'>
        <DropdownMenuItem asChild>
          <Link href={`/admin/cases/${caseItem.id}`}>
            <Eye className='size-4' />
            مشاهده
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(caseItem)
            setOpen('update')
          }}
        >
          <Pencil className='size-4' />
          ویرایش
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='text-destructive focus:text-destructive'
          onClick={() => {
            setCurrentRow(caseItem)
            setOpen('delete')
          }}
        >
          <Trash2 className='size-4' />
          حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
