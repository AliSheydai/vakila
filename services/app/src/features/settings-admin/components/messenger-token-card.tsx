'use client'

import { useMemo, useState } from 'react'
import { Eye, EyeOff, Loader2, Power, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import {
  TOKEN_FORMAT_DESCRIPTIONS,
  TOKEN_FORMAT_HINTS,
  validateMessengerToken,
} from '@/lib/messenger-token-validation'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type {
  MessengerPlatform,
  MessengerTokenStatus,
  NotificationDeliverySettings,
} from '../types'

type MessengerTokenCardProps = {
  platform: MessengerPlatform
  label: string
  icon: React.ReactNode
  helpText: string
  helpUrl?: string
  status: MessengerTokenStatus
  onSaved: (
    status: MessengerTokenStatus,
    notificationDelivery?: NotificationDeliverySettings
  ) => void
}

export function MessengerTokenCard({
  platform,
  label,
  icon,
  helpText,
  helpUrl,
  status,
  onSaved,
}: MessengerTokenCardProps) {
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const tokenValidation = useMemo(() => {
    const trimmed = token.trim()
    if (!trimmed) return null
    return validateMessengerToken(platform, trimmed)
  }, [platform, token])

  const tokenError =
    tokenValidation && !tokenValidation.valid ? tokenValidation.message : null
  const canSave = Boolean(token.trim() && tokenValidation?.valid)

  async function handleToggleEnabled() {
    const nextEnabled = !status.enabled

    setToggling(true)
    const result = await api<{
      messenger: MessengerTokenStatus
      notificationDelivery?: NotificationDeliverySettings
    }>('/api/settings/messengers/enabled', {
      method: 'PATCH',
      body: { platform, enabled: nextEnabled },
    })
    setToggling(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    onSaved(result.data.messenger, result.data.notificationDelivery)
    toast.success(
      nextEnabled
        ? `چت‌بات ${label} فعال شد.`
        : `چت‌بات ${label} غیرفعال شد.`
    )
    if (result.data.notificationDelivery) {
      toast.info(
        'کانال اعلان چت‌بات به «فقط داخل پورتال» تغییر کرد، چون این پیام‌رسان غیرفعال شد.'
      )
    }
  }

  async function handleSave() {
    const trimmed = token.trim()
    const validation = validateMessengerToken(platform, trimmed)
    if (!validation.valid) {
      toast.error(validation.message)
      return
    }

    setSaving(true)
    const result = await api<{ messenger: MessengerTokenStatus }>(
      '/api/settings/messengers',
      {
        method: 'PATCH',
        body: { platform, token: trimmed },
      }
    )
    setSaving(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setToken('')
    onSaved(result.data.messenger)
    toast.success(`توکن ${label} ذخیره شد.`)
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await api<{
      messenger: MessengerTokenStatus
      notificationDelivery?: NotificationDeliverySettings
    }>(`/api/settings/messengers?platform=${platform}`, {
      method: 'DELETE',
    })
    setDeleting(false)
    setDeleteOpen(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setToken('')
    onSaved(result.data.messenger, result.data.notificationDelivery)
    toast.success(`توکن ${label} حذف شد.`)
    if (result.data.notificationDelivery) {
      toast.info(
        'کانال اعلان چت‌بات به «فقط داخل پورتال» تغییر کرد، چون توکن این پیام‌رسان حذف شد.'
      )
    }
  }

  return (
    <>
      <Card className='border-sidebar-border bg-card'>
        <CardHeader className='gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex items-start gap-3'>
            <div className='flex size-10 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground'>
              {icon}
            </div>
            <div className='space-y-1'>
              <CardTitle className='text-base'>{label}</CardTitle>
              <CardDescription className='text-xs leading-relaxed sm:text-sm'>
                {helpText}
                {helpUrl ? (
                  <>
                    {' '}
                    <a
                      href={helpUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary underline-offset-4 hover:underline'
                    >
                      راهنمای دریافت توکن
                    </a>
                  </>
                ) : null}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={status.configured ? 'default' : 'secondary'}
            className='w-fit shrink-0'
          >
            {status.configured ? 'توکن ثبت شده' : 'توکن ندارد'}
          </Badge>
        </CardHeader>

        <CardContent className='space-y-4'>
          <Button
            type='button'
            variant='outline'
            disabled={toggling || !status.configured}
            onClick={() => void handleToggleEnabled()}
            className={cn(
              'h-auto w-full justify-center gap-2 border py-2.5 text-sm font-medium transition-colors',
              !status.configured && 'opacity-60',
              status.enabled
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            )}
          >
            {toggling ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Power className='size-4' />
            )}
            {status.enabled ? 'چت‌بات فعال است' : 'چت‌بات غیرفعال است'}
          </Button>

          {!status.configured ? (
            <p className='text-xs text-muted-foreground'>
              برای فعال‌سازی چت‌بات، ابتدا توکن را ثبت کنید.
            </p>
          ) : null}

          {status.configured && status.hint ? (
            <p className='text-xs text-muted-foreground'>
              توکن فعلی:{' '}
              <span dir='ltr' className='font-mono text-foreground'>
                {status.hint}
              </span>
            </p>
          ) : null}

          <div className='space-y-2'>
            <Label htmlFor={`token-${platform}`}>توکن بات</Label>
            <div className='flex gap-2'>
              <Input
                id={`token-${platform}`}
                dir='ltr'
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={
                  status.configured
                    ? 'توکن جدید وارد کنید'
                    : TOKEN_FORMAT_HINTS[platform]
                }
                className={cn(
                  'font-mono text-sm',
                  tokenError && 'border-destructive'
                )}
                autoComplete='off'
                aria-invalid={Boolean(tokenError)}
                aria-describedby={`token-${platform}-hint`}
              />
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='shrink-0'
                onClick={() => setShowToken((v) => !v)}
                aria-label={showToken ? 'مخفی کردن توکن' : 'نمایش توکن'}
              >
                {showToken ? (
                  <EyeOff className='size-4' />
                ) : (
                  <Eye className='size-4' />
                )}
              </Button>
            </div>
            <p
              id={`token-${platform}-hint`}
              className='text-xs leading-relaxed text-muted-foreground'
            >
              {TOKEN_FORMAT_DESCRIPTIONS[platform]}
            </p>
            {tokenError ? (
              <p className='text-xs text-destructive'>{tokenError}</p>
            ) : null}
          </div>
        </CardContent>

        <CardFooter className='flex flex-wrap gap-2 border-t border-sidebar-border pt-4 sm:justify-between'>
          {status.configured ? (
            <Button
              type='button'
              variant='outline'
              className='w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto'
              disabled={deleting || saving}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className='size-4' />
              حذف توکن
            </Button>
          ) : null}
          <Button
            type='button'
            className={cn('w-full sm:w-auto', !status.configured && 'sm:ms-auto')}
            onClick={() => void handleSave()}
            disabled={saving || deleting || !canSave}
          >
            {saving ? <Loader2 className='size-4 animate-spin' /> : null}
            ذخیره
          </Button>
        </CardFooter>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title='حذف توکن'
        desc={`توکن ${label} حذف می‌شود، چت‌بات غیرفعال می‌شود و در صورت استفاده در اعلان‌ها، کانال به «فقط داخل پورتال» برمی‌گردد.`}
        confirmText='حذف توکن'
        destructive
        isLoading={deleting}
        handleConfirm={() => void handleDelete()}
      />
    </>
  )
}
