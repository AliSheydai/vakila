'use client'

import { useCallback, useEffect, useState } from 'react'
import { HardDrive, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { formatFileSize } from '@/features/cases/utils/format'

type StorageSummary = {
  limitBytes: number
  usedBytes: number
  usedPercent: number
  fileCount: number
}

type UserUsage = {
  userId: string
  userName: string | null
  userPhone: string
  userRole: string
  usedBytes: number
  fileCount: number
  usedPercent: number
}

type StorageFile = {
  id: string
  name: string
  mimeType: string
  size: number
  uploadedAt: string
  uploadedByName: string | null
  caseTitle: string | null
  clientName: string | null
}

type StorageData = {
  summary: StorageSummary
  byUser: UserUsage[]
  files: StorageFile[]
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'ادمین',
  lawyer: 'وکیل',
  client: 'موکل',
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function StorageAdminPage() {
  const [data, setData] = useState<StorageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<StorageFile | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await api<StorageData>('/api/storage')
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      setData(null)
      return
    }
    setData(result.data)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function confirmDelete() {
    if (!toDelete) return
    setDeletingId(toDelete.id)
    const result = await api<{ deleted: boolean }>(
      `/api/storage/${toDelete.id}`,
      { method: 'DELETE' }
    )
    setDeletingId(null)
    setToDelete(null)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('فایل حذف شد.')
    void load()
  }

  const summary = data?.summary

  return (
    <>
      <Header fixed>
        <Search />
        <ThemeSwitch />
      </Header>
      <Main className='flex flex-1 flex-col gap-6'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
            <HardDrive className='size-6' />
            ذخیره‌سازی فایل‌ها
          </h1>
          <p className='text-sm text-muted-foreground'>
            مصرف RustFS — محدودیت کل سیستم و مصرف هر کاربر
          </p>
        </div>

        {loading ? (
          <Skeleton className='h-32 w-full' />
        ) : error ? (
          <p className='text-sm text-destructive'>{error}</p>
        ) : summary ? (
          <>
            <div className='rounded-lg border p-4'>
              <div className='mb-2 flex items-center justify-between text-sm'>
                <span>مصرف کل سیستم</span>
                <span className='font-medium'>
                  {summary.usedPercent.toLocaleString('fa-IR', {
                    maximumFractionDigits: 1,
                  })}
                  ٪ — {formatFileSize(summary.usedBytes)} از{' '}
                  {summary.limitBytes > 0
                    ? formatFileSize(summary.limitBytes)
                    : 'نامحدود'}
                </span>
              </div>
              <div className='h-2 overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-primary transition-all'
                  style={{ width: `${Math.min(100, summary.usedPercent)}%` }}
                />
              </div>
              <p className='mt-2 text-xs text-muted-foreground'>
                {summary.fileCount.toLocaleString('fa-IR')} فایل
              </p>
            </div>

            <div>
              <h2 className='mb-3 text-lg font-semibold'>مصرف به تفکیک کاربر</h2>
              <div className='overflow-x-auto rounded-lg border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>کاربر</TableHead>
                      <TableHead>نقش</TableHead>
                      <TableHead>تعداد</TableHead>
                      <TableHead>حجم</TableHead>
                      <TableHead>درصد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.byUser.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className='text-center text-muted-foreground'>
                          هنوز فایلی آپلود نشده
                        </TableCell>
                      </TableRow>
                    ) : (
                      data!.byUser.map((row) => (
                        <TableRow key={row.userId}>
                          <TableCell>
                            {row.userName || row.userPhone}
                          </TableCell>
                          <TableCell>
                            {ROLE_LABELS[row.userRole] ?? row.userRole}
                          </TableCell>
                          <TableCell>
                            {row.fileCount.toLocaleString('fa-IR')}
                          </TableCell>
                          <TableCell>{formatFileSize(row.usedBytes)}</TableCell>
                          <TableCell>
                            {row.usedPercent.toLocaleString('fa-IR', {
                              maximumFractionDigits: 1,
                            })}
                            ٪
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div>
              <h2 className='mb-3 text-lg font-semibold'>فایل‌ها</h2>
              <div className='overflow-x-auto rounded-lg border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام</TableHead>
                      <TableHead>حجم</TableHead>
                      <TableHead>آپلودکننده</TableHead>
                      <TableHead>مربوط به</TableHead>
                      <TableHead>تاریخ</TableHead>
                      <TableHead className='w-12' />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.files.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center text-muted-foreground'>
                          فایلی یافت نشد
                        </TableCell>
                      </TableRow>
                    ) : (
                      data!.files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell className='max-w-[200px] truncate'>
                            {file.name}
                          </TableCell>
                          <TableCell>{formatFileSize(file.size)}</TableCell>
                          <TableCell>{file.uploadedByName ?? '—'}</TableCell>
                          <TableCell className='max-w-[160px] truncate'>
                            {file.caseTitle ?? file.clientName ?? '—'}
                          </TableCell>
                          <TableCell>{formatDate(file.uploadedAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='text-destructive'
                              disabled={deletingId === file.id}
                              onClick={() => setToDelete(file)}
                            >
                              {deletingId === file.id ? (
                                <Loader2 className='size-4 animate-spin' />
                              ) : (
                                <Trash2 className='size-4' />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        ) : null}

        <ConfirmDialog
          open={Boolean(toDelete)}
          onOpenChange={(open) => !open && setToDelete(null)}
          title='حذف فایل'
          desc={
            toDelete
              ? `آیا از حذف «${toDelete.name}» از RustFS مطمئن هستید؟`
              : ''
          }
          confirmText='حذف'
          destructive
          handleConfirm={() => void confirmDelete()}
        />
      </Main>
    </>
  )
}
