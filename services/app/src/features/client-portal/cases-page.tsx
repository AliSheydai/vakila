'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, FolderOpen, Plus, Search as SearchIcon } from 'lucide-react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePortalHydration } from './hooks/use-portal-hydration'
import { usePortalStore } from './stores/portal-store'
import { PageShell, PortalListSkeleton } from './components/page-shell'
import { ErrorState } from './components/error-state'
import { EmptyState } from './components/empty-state'
import { CaseStatusBadge } from './components/status-badges'
import { ClientCreateCaseDrawer } from './components/client-create-case-drawer'
import {
  CLIENT_CASE_STATUSES,
  CLIENT_CASE_STATUS_LABELS,
  LEGAL_AREA_LABELS,
  type ClientCaseStatus,
} from './types'
import { formatDate } from './utils/format'

type SortKey = 'updated' | 'newest' | 'oldest' | 'title'

export function ClientCasesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status')
  const { hydrated } = usePortalHydration()
  const cases = usePortalStore((s) => s.cases)
  const lawyers = usePortalStore((s) => s.lawyers)
  const error = usePortalStore((s) => s.error)
  const hydrate = usePortalStore((s) => s.hydrate)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<string>(
    initialStatus &&
      CLIENT_CASE_STATUSES.includes(initialStatus as ClientCaseStatus)
      ? initialStatus
      : 'all'
  )
  const [sort, setSort] = useState<SortKey>('updated')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = cases.filter((item) => {
      const matchesStatus = status === 'all' || item.status === status
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.caseNumber.includes(query.trim())
      return matchesStatus && matchesQuery
    })

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        case 'oldest':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        case 'title':
          return a.title.localeCompare(b.title, 'fa')
        case 'updated':
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
      }
    })

    return list
  }, [cases, query, status, sort])

  const getLawyerName = (id: string) =>
    lawyers.find((l) => l.id === id)?.name ?? '—'

  const openCase = (caseId: string) => {
    router.push(`/cases/${caseId}`)
  }

  const createAction = (
    <Button onClick={() => setCreateOpen(true)}>
      <Plus className='size-4' />
      ثبت پرونده جدید
    </Button>
  )

  return (
    <PageShell
      title='پرونده‌ها'
      description='پرونده‌های حقوقی خود را مشاهده کنید، پرونده جدید ثبت کنید و وضعیت آن‌ها را پیگیری کنید.'
      actions={hydrated && !error ? createAction : undefined}
    >
      {!hydrated ? (
        <PortalListSkeleton cards={0} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => hydrate()} />
      ) : cases.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title='هنوز پرونده‌ای ثبت نشده است.'
          description='می‌توانید خودتان پرونده ثبت کنید یا منتظر بمانید تا وکیل پرونده‌ای برای شما ایجاد کند.'
          actionLabel='ثبت پرونده جدید'
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className='space-y-4'>
          <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
            <div className='relative min-w-0 flex-1 sm:max-w-sm'>
              <SearchIcon className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='جستجو بر اساس عنوان یا شماره پرونده'
                className='ps-9'
                aria-label='جستجوی پرونده'
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='w-full sm:w-44' aria-label='فیلتر وضعیت'>
                <SelectValue placeholder='وضعیت' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>همه وضعیت‌ها</SelectItem>
                {CLIENT_CASE_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {CLIENT_CASE_STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sort}
              onValueChange={(value) => setSort(value as SortKey)}
            >
              <SelectTrigger className='w-full sm:w-44' aria-label='مرتب‌سازی'>
                <SelectValue placeholder='مرتب‌سازی' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='updated'>آخرین بروزرسانی</SelectItem>
                <SelectItem value='newest'>جدیدترین</SelectItem>
                <SelectItem value='oldest'>قدیمی‌ترین</SelectItem>
                <SelectItem value='title'>عنوان</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <p className='rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground'>
              نتیجه‌ای با این فیلتر یافت نشد.
            </p>
          ) : (
            <>
              <div className='hidden overflow-x-auto rounded-xl border md:block'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='text-start'>عنوان</TableHead>
                      <TableHead className='text-start'>شماره</TableHead>
                      <TableHead className='text-start'>وکیل</TableHead>
                      <TableHead className='text-start'>وضعیت</TableHead>
                      <TableHead className='text-start'>آخرین بروزرسانی</TableHead>
                      <TableHead className='text-start'>تاریخ ایجاد</TableHead>
                      <TableHead className='w-28 text-start'>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow
                        key={item.id}
                        className='cursor-pointer'
                        onClick={() => openCase(item.id)}
                      >
                        <TableCell>
                          <div className='space-y-0.5'>
                            <p className='font-medium'>{item.title}</p>
                            <p className='text-xs text-muted-foreground'>
                              {LEGAL_AREA_LABELS[item.legalArea]}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className='tabular-nums'>
                          {item.caseNumber}
                        </TableCell>
                        <TableCell>{getLawyerName(item.lawyerId)}</TableCell>
                        <TableCell>
                          <CaseStatusBadge status={item.status} />
                        </TableCell>
                        <TableCell>{formatDate(item.updatedAt)}</TableCell>
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                        <TableCell>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={(e) => {
                              e.stopPropagation()
                              openCase(item.id)
                            }}
                          >
                            <Eye className='size-4' />
                            مشاهده
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ul className='space-y-3 md:hidden'>
                {filtered.map((item) => (
                  <li key={item.id} className='rounded-xl border p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0 space-y-1'>
                        <button
                          type='button'
                          className='line-clamp-2 text-start font-semibold hover:underline'
                          onClick={() => openCase(item.id)}
                        >
                          {item.title}
                        </button>
                        <p className='text-xs tabular-nums text-muted-foreground'>
                          {item.caseNumber} · {LEGAL_AREA_LABELS[item.legalArea]}
                        </p>
                      </div>
                      <CaseStatusBadge status={item.status} />
                    </div>
                    <dl className='mt-3 grid grid-cols-2 gap-2 text-xs'>
                      <div>
                        <dt className='text-muted-foreground'>وکیل</dt>
                        <dd className='mt-0.5 font-medium'>
                          {getLawyerName(item.lawyerId)}
                        </dd>
                      </div>
                      <div>
                        <dt className='text-muted-foreground'>بروزرسانی</dt>
                        <dd className='mt-0.5 font-medium'>
                          {formatDate(item.updatedAt)}
                        </dd>
                      </div>
                    </dl>
                    <Button
                      variant='outline'
                      size='sm'
                      className='mt-3 w-full'
                      onClick={() => openCase(item.id)}
                    >
                      <Eye className='size-4' />
                      مشاهده پرونده
                    </Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <ClientCreateCaseDrawer open={createOpen} onOpenChange={setCreateOpen} />
    </PageShell>
  )
}
