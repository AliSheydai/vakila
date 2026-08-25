'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import type { Case, Client } from '@/features/cases/types'
import {
  buildClientTableRows,
  clientsColumns,
  type ClientTableRow,
} from './clients-columns'
import { ClientsMobileList } from './clients-mobile-list'

type ClientsTableProps = {
  clients: Client[]
  cases: Case[]
}

type SortPreset = 'newest' | 'oldest' | 'name_asc'

function sortingFromPreset(preset: SortPreset): SortingState {
  switch (preset) {
    case 'oldest':
      return [{ id: 'createdAt', desc: false }]
    case 'name_asc':
      return [{ id: 'name', desc: false }]
    case 'newest':
    default:
      return [{ id: 'createdAt', desc: true }]
  }
}

export function ClientsTable({ clients, cases }: ClientsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const data = useMemo(
    () => buildClientTableRows(clients, cases),
    [clients, cases]
  )

  const defaultSearch = useMemo(() => {
    const obj: Record<string, unknown> = {}
    searchParams.forEach((val, key) => {
      if (val.includes(',')) {
        obj[key] = val.split(',')
      } else if (!isNaN(Number(val)) && val.trim() !== '') {
        obj[key] = Number(val)
      } else {
        obj[key] = val
      }
    })
    return obj
  }, [searchParams])

  const defaultNavigate: NavigateFn = useCallback(
    ({ search: newSearch, replace }) => {
      const nextSearchObj =
        typeof newSearch === 'function'
          ? newSearch(defaultSearch)
          : newSearch === true
            ? defaultSearch
            : newSearch

      const params = new URLSearchParams()
      Object.entries(nextSearchObj || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          if (Array.isArray(v)) {
            if (v.length > 0) params.set(k, v.join(','))
          } else {
            params.set(k, String(v))
          }
        }
      })

      const queryStr = params.toString()
      const url = queryStr ? `${pathname}?${queryStr}` : pathname
      if (replace) router.replace(url)
      else router.push(url)
    },
    [router, pathname, defaultSearch]
  )

  const [sorting, setSorting] = useState<SortingState>(
    sortingFromPreset('newest')
  )
  const [sortPreset, setSortPreset] = useState<SortPreset>('newest')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    createdAt: false,
  })

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: defaultSearch,
    navigate: defaultNavigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'activity', searchKey: 'activity', type: 'array' },
    ],
  })

  const table = useReactTable({
    data,
    columns: clientsColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase()
      if (!query) return true

      const item = row.original as ClientTableRow
      return (
        item.name.toLowerCase().includes(query) ||
        item.phone.toLowerCase().includes(query) ||
        (item.email ?? '').toLowerCase().includes(query) ||
        (item.nationalId ?? '').toLowerCase().includes(query)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
  })

  const pageCount = table.getPageCount()
  useEffect(() => {
    ensurePageInRange(pageCount)
  }, [pageCount, ensurePageInRange])

  const hasActiveFilters = Boolean(globalFilter) || columnFilters.length > 0

  const clearFilters = () => {
    table.resetColumnFilters()
    table.setGlobalFilter('')
  }

  const filteredRows = table.getRowModel().rows.map((row) => row.original)

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
        <DataTableToolbar
          table={table}
          searchPlaceholder='جستجو نام، موبایل یا ایمیل...'
          filters={[
            {
              columnId: 'activity',
              title: 'وضعیت پرونده',
              options: [
                {
                  label: 'دارای پرونده فعال',
                  value: 'with_active_case',
                },
                {
                  label: 'بدون پرونده فعال',
                  value: 'without_active_case',
                },
              ],
            },
          ]}
        />
        <Select
          value={sortPreset}
          onValueChange={(value: SortPreset) => {
            setSortPreset(value)
            setSorting(sortingFromPreset(value))
          }}
        >
          <SelectTrigger
            className='h-8 w-full shrink-0 lg:w-48'
            aria-label='مرتب‌سازی موکل‌ها'
          >
            <SelectValue placeholder='مرتب‌سازی' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='newest'>جدیدترین موکل</SelectItem>
            <SelectItem value='oldest'>قدیمی‌ترین موکل</SelectItem>
            <SelectItem value='name_asc'>نام الفبایی</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ClientsMobileList
        rows={filteredRows}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      <div className='hidden overflow-x-auto rounded-md border md:block'>
        <Table className='min-w-3xl'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      header.column.columnDef.meta?.className,
                      header.column.columnDef.meta?.thClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className='cursor-pointer'
                  onClick={(event) => {
                    const target = event.target as HTMLElement
                    if (target.closest('a,button,[role="menuitem"]')) return
                    router.push(`/admin/clients/${row.original.id}`)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={clientsColumns.length}
                  className='h-32 text-center'
                >
                  <div className='space-y-3 py-2'>
                    <p className='text-sm text-muted-foreground'>
                      {hasActiveFilters
                        ? 'موکلی با این مشخصات پیدا نشد.'
                        : 'نتیجه‌ای یافت نشد.'}
                    </p>
                    {hasActiveFilters && (
                      <Button variant='ghost' size='sm' onClick={clearFilters}>
                        پاک کردن جستجو و فیلتر
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}
