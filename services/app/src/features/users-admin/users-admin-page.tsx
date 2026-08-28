'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Users } from 'lucide-react'
import { api } from '@/lib/api-client'
import type { AuthRole } from '@/stores/auth-store'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type AdminUser = {
  id: string
  phone: string
  name: string | null
  email: string | null
  role: AuthRole
  isActive: boolean
  createdAt: string
}

const ROLE_LABELS: Record<AuthRole, string> = {
  super_admin: 'ادمین کل',
  lawyer: 'وکیل',
  client: 'موکل',
}

const ROLE_OPTIONS: AuthRole[] = ['super_admin', 'lawyer', 'client']

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

export function UsersAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await api<AdminUser[]>('/api/users')
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      setUsers([])
      return
    }
    setUsers(result.data)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function changeRole(userId: string, role: AuthRole) {
    setUpdatingId(userId)
    const result = await api<AdminUser>(`/api/users/${userId}`, {
      method: 'PATCH',
      body: { role },
    })
    setUpdatingId(null)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...result.data } : u))
    )
    toast.success('نقش کاربر به‌روز شد.')
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='min-w-0'>
          <h2 className='font-display text-xl font-bold tracking-tight sm:text-2xl'>
            کاربران
          </h2>
          <p className='mt-1 text-sm text-muted-foreground sm:text-base'>
            مدیریت نقش و وضعیت کاربران سیستم.
          </p>
        </div>

        {loading ? (
          <div className='space-y-3'>
            <Skeleton className='h-10 w-full max-w-sm' />
            <Skeleton className='h-64 w-full rounded-xl' />
          </div>
        ) : error ? (
          <div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive'>
            {error}
          </div>
        ) : users.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center'>
            <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
              <Users className='size-5 text-muted-foreground' />
            </div>
            <div className='space-y-1'>
              <p className='font-medium'>هنوز کاربری ثبت نشده</p>
              <p className='text-sm text-muted-foreground'>
                با ورود از طریق کد یک‌بارمصرف، کاربران اینجا ظاهر می‌شوند.
              </p>
            </div>
          </div>
        ) : (
          <div className='overflow-hidden rounded-xl border'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/40 hover:bg-muted/40'>
                  <TableHead className='text-start'>نام</TableHead>
                  <TableHead className='text-start'>موبایل</TableHead>
                  <TableHead className='text-start'>نقش</TableHead>
                  <TableHead className='text-start'>تاریخ عضویت</TableHead>
                  <TableHead className='text-start'>وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className='font-medium'>
                      {user.name?.trim() || (
                        <span className='text-muted-foreground'>بدون نام</span>
                      )}
                    </TableCell>
                    <TableCell dir='ltr' className='text-start font-mono text-sm'>
                      {user.phone}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        disabled={updatingId === user.id}
                        onValueChange={(value) => {
                          void changeRole(user.id, value as AuthRole)
                        }}
                      >
                        <SelectTrigger className='h-9 w-36'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={cn(
                          'font-normal',
                          user.isActive
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'border-muted-foreground/30 text-muted-foreground'
                        )}
                      >
                        {user.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Main>
    </>
  )
}
