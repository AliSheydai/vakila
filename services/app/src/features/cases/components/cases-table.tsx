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
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import {
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  LEGAL_AREAS,
  LEGAL_AREA_LABELS,
} from '../types'
import {
  buildCaseTableRows,
  casesColumns,
  type CaseTableRow,
} from './cases-columns'
import { CasesMobileList } from './cases-mobile-list'
import type { Case, Client } from '../types'

type CasesTableProps = {
  cases: Case[]
  clients: Client[]
}

type SortPreset = 'newest' | 'oldest' | 'updated'

function sortingFromPreset(preset: SortPreset): SortingState {
  switch (preset) {
    case 'oldest':
      return [{ id: 'createdAt', desc: false }]
    case 'updated':
      return [{ id: 'updatedAt', desc: true }]
    case 'newest':
    default:
      return [{ id: 'createdAt', desc: true }]
  }
}

export function CasesTable({ cases, clients }: CasesTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const data = useMemo(
    () => buildCaseTableRows(cases, clients),
    [cases, clients]
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
      { columnId: 'status', searchKey: 'status', type: 'array' },
      { columnId: 'legalArea', searchKey: 'legalArea', type: 'array' },
    ],
  })

  const table = useReactTable({
    data,
    columns: casesColumns,
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

      const item = row.original as CaseTableRow
      return (
        item.title.toLowerCase().includes(query) ||
        item.caseNumber.toLowerCase().includes(query) ||
        item.clientName.toLowerCase().includes(query)
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

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
        <DataTableToolbar
          table={table}
          searchPlaceholder='جستجو در عنوان، شماره یا موکل...'
          resetLabel='پاک کردن'
          showViewOptions={false}
          filters={[
            {
              columnId: 'status',
              title: 'وضعیت',
              options: CASE_STATUSES.map((status) => ({
                label: CASE_STATUS_LABELS[status],
                value: status,
              })),
            },
            {
              columnId: 'legalArea',
              title: 'نوع',
              options: LEGAL_AREAS.map((area) => ({
                label: LEGAL_AREA_LABELS[area],
                value: area,
              })),
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
            aria-label='مرتب‌سازی پرونده‌ها'
          >
            <SelectValue placeholder='مرتب‌سازی' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='newest'>جدیدترین</SelectItem>
            <SelectItem value='oldest'>قدیمی‌ترین</SelectItem>
            <SelectItem value='updated'>آخرین بروزرسانی</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <CasesMobileList rows={table.getRowModel().rows.map((row) => row.original)} />

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
                    router.push(`/admin/cases/${row.original.id}`)
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
                  colSpan={casesColumns.length}
                  className='h-24 text-center text-muted-foreground'
                >
                  نتیجه‌ای با این فیلتر یافت نشد.
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
