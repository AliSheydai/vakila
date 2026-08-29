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

  const [proxyConfig, setProxyConfig] = useState('')
  const [showProxy, setShowProxy] = useState(false)
  const [testingProxy, setTestingProxy] = useState(false)
  const [savingProxy, setSavingProxy] = useState(false)
  const [deletingProxy, setDeletingProxy] = useState(false)
  const [lastSocks, setLastSocks] = useState<string | null>(null)
  /** Session flag: successful ping this visit (in addition to server `proxy.running`). */
  const [proxyPingOk, setProxyPingOk] = useState(false)

  const isTelegram = platform === 'telegram'
  const proxy = status.proxy
  const proxyReady = Boolean(proxy?.configured && (proxy.running || proxyPingOk))

  const tokenValidation = useMemo(() => {
    const trimmed = token.trim()
    if (!trimmed) return null
    return validateMessengerToken(platform, trimmed)
  }, [platform, token])

  const tokenError =
    tokenValidation && !tokenValidation.valid ? tokenValidation.message : null
  const canSaveToken = Boolean(
    token.trim() &&
      tokenValidation?.valid &&
      (!isTelegram || proxyReady)
  )
  const canSaveProxy = Boolean(proxyConfig.trim())
  const canEnable = Boolean(
    status.configured && (!isTelegram || proxyReady)
  )

  async function handleToggleEnabled() {
    if (!status.enabled && isTelegram && !proxyReady) {
      toast.error(
        'ابتدا کانفیگ V2Ray را وارد کنید، پینگ بگیرید و ذخیره کنید؛ سپس توکن را ثبت کنید.'
      )
      return
    }

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
    if (result.data.messenger.proxy?.running) {
      setProxyPingOk(true)
    }
    const modeHint =
      nextEnabled &&
      (result.data.messenger.platform === 'telegram' ||
        result.data.messenger.platform === 'bale') &&
      !result.data.messenger.webhookSetAt
        ? ' (حالت توسعه / polling)'
        : ''
    toast.success(
      nextEnabled
        ? result.data.messenger.botUsername
          ? `چت‌بات ${label} فعال شد (@${result.data.messenger.botUsername})${modeHint}.`
          : `چت‌بات ${label} فعال شد${modeHint}.`
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

    if (isTelegram && !proxyReady) {
      toast.error(
        'قبل از ثبت توکن، کانفیگ V2Ray را تست (پینگ) و ذخیره کنید.'
      )
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
    if (result.data.messenger.proxy?.running) {
      setProxyPingOk(true)
    }
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

  async function handleTestProxy() {
    const config = proxyConfig.trim()
    setTestingProxy(true)
    const result = await api<{
      socks?: { host: string; port: number; url: string }
      latencyMs?: number
      remark?: string
      running?: boolean
      messenger?: MessengerTokenStatus
    }>('/api/settings/messengers/proxy/test', {
      method: 'POST',
      // Keep SOCKS alive so poller / Bot API can reuse the same process.
      body: config ? { config, keepAlive: true } : { keepAlive: true },
    })
    setTestingProxy(false)

    if (!result.ok) {
      setLastSocks(null)
      setProxyPingOk(false)
      toast.error(result.error)
      return
    }

    const socks = result.data.socks
    const socksLabel = socks ? `${socks.host}:${socks.port}` : null
    setLastSocks(socksLabel)
    setProxyPingOk(Boolean(result.data.running ?? socks))
    if (result.data.messenger) {
      onSaved(result.data.messenger)
      setProxyConfig('')
    }
    toast.success(
      socksLabel
        ? `پینگ موفق — پروکسی فعال ماند. SOCKS5: ${socksLabel}${
            result.data.latencyMs != null
              ? ` · ${result.data.latencyMs}ms`
              : ''
          }`
        : 'پینگ کانفیگ موفق بود؛ پروکسی فعال ماند.'
    )
  }

  async function handleSaveProxy() {
    const config = proxyConfig.trim()
    if (!config) {
      toast.error('لینک کانفیگ V2Ray را وارد کنید.')
      return
    }

    setSavingProxy(true)
    const result = await api<{ messenger: MessengerTokenStatus }>(
      '/api/settings/messengers/proxy',
      {
        method: 'PATCH',
        body: { config, activate: true },
      }
    )
    setSavingProxy(false)

    if (!result.ok) {
      setProxyPingOk(false)
      toast.error(result.error)
      return
    }

    setProxyConfig('')
    onSaved(result.data.messenger)
    const p = result.data.messenger.proxy
    if (p?.running && p.socksHost && p.socksPort) {
      setLastSocks(`${p.socksHost}:${p.socksPort}`)
      setProxyPingOk(true)
      toast.success(
        `پروکسی ذخیره و پینگ شد (SOCKS5 ${p.socksHost}:${p.socksPort}).`
      )
    } else {
      setProxyPingOk(Boolean(p?.configured))
      toast.success('کانفیگ پروکسی ذخیره شد.')
    }
  }

  async function handleDeleteProxy() {
    setDeletingProxy(true)
    const result = await api<{
      messenger: MessengerTokenStatus
      notificationDelivery?: NotificationDeliverySettings
    }>('/api/settings/messengers/proxy', { method: 'DELETE' })
    setDeletingProxy(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setProxyConfig('')
    setLastSocks(null)
    setProxyPingOk(false)
    onSaved(result.data.messenger, result.data.notificationDelivery)
    toast.success('کانفیگ پروکسی حذف شد.')
    if (result.data.notificationDelivery) {
      toast.info(
        'کانال اعلان چت‌بات به «فقط داخل پورتال» تغییر کرد، چون پروکسی تلگرام حذف شد.'
      )
    } else if (status.enabled) {
      toast.info('چت‌بات تلگرام به‌خاطر حذف پروکسی غیرفعال شد.')
    }
  }

  const statusBadge = (() => {
    if (status.enabled) return { variant: 'default' as const, text: 'چت‌بات فعال' }
    if (isTelegram && status.configured && proxyReady) {
      return { variant: 'secondary' as const, text: 'آمادهٔ فعال‌سازی' }
    }
    if (status.configured) {
      return { variant: 'secondary' as const, text: 'توکن ثبت شده' }
    }
    if (isTelegram && proxyReady) {
      return { variant: 'secondary' as const, text: 'پروکسی آماده' }
    }
    return { variant: 'outline' as const, text: 'توکن ندارد' }
  })()

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
          <Badge variant={statusBadge.variant} className='w-fit shrink-0'>
            {statusBadge.text}
          </Badge>
        </CardHeader>

        <CardContent className='space-y-4'>
          <Button
            type='button'
            variant='outline'
            disabled={toggling || (!status.enabled && !canEnable)}
            onClick={() => void handleToggleEnabled()}
            className={cn(
              'h-auto w-full justify-center gap-2 border py-2.5 text-sm font-medium transition-colors',
              !status.enabled && !canEnable && 'opacity-60',
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

          {isTelegram && !status.enabled ? (
            <p className='text-xs leading-relaxed text-muted-foreground'>
              {!proxyReady
                ? 'مرحله ۱: کانفیگ V2Ray را وارد کنید، پینگ بگیرید و ذخیره کنید.'
                : !status.configured
                  ? 'مرحله ۲: توکن بات را وارد و ذخیره کنید.'
                  : 'مرحله ۳: دکمهٔ بالا را بزنید تا چت‌بات فعال شود.'}
            </p>
          ) : !status.configured ? (
            <p className='text-xs text-muted-foreground'>
              برای فعال‌سازی چت‌بات، ابتدا توکن را ثبت کنید.
            </p>
          ) : null}

          {status.configured && status.botUsername ? (
            <p className='text-xs text-muted-foreground'>
              بات:{' '}
              <span dir='ltr' className='font-mono text-foreground'>
                @{status.botUsername}
              </span>
              {status.enabled ? (
                <span className='ms-2 text-emerald-600 dark:text-emerald-400'>
                  {status.webhookSetAt
                    ? '· webhook متصل'
                    : '· حالت polling (لوکال)'}
                </span>
              ) : null}
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

          {isTelegram ? (
            <div className='space-y-3 rounded-lg border border-sidebar-border bg-muted/20 p-3'>
              <div className='space-y-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Label htmlFor='telegram-v2ray-config'>
                    ۱. کانفیگ V2Ray (VLESS) — الزامی
                  </Label>
                  {proxyReady ? (
                    <Badge
                      variant='secondary'
                      className='border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    >
                      پینگ موفق
                    </Badge>
                  ) : null}
                </div>
                <p className='text-xs leading-relaxed text-muted-foreground'>
                  لینک اشتراک vless:// را وارد کنید، با «تست کانفیگ» پینگ بگیرید،
                  سپس ذخیره کنید. بدون پروکسی وصل‌شونده نمی‌توانید توکن ثبت یا
                  چت‌بات بسازید.
                </p>
              </div>

              {proxy?.configured ? (
                <p className='text-xs text-muted-foreground'>
                  کانفیگ فعلی:{' '}
                  <span dir='ltr' className='font-mono text-foreground'>
                    {proxy.hint}
                  </span>
                  {proxy.running && proxy.socksHost && proxy.socksPort ? (
                    <span className='ms-2 text-emerald-600 dark:text-emerald-400'>
                      · SOCKS5 {proxy.socksHost}:{proxy.socksPort}
                    </span>
                  ) : proxyReady ? (
                    <span className='ms-2 text-emerald-600 dark:text-emerald-400'>
                      · پینگ تأیید شد
                    </span>
                  ) : (
                    <span className='ms-2 text-amber-600 dark:text-amber-400'>
                      · دوباره تست کنید تا پینگ تأیید شود
                    </span>
                  )}
                </p>
              ) : null}

              {lastSocks && !proxy?.running ? (
                <p className='text-xs text-muted-foreground'>
                  آخرین پینگ موفق:{' '}
                  <span dir='ltr' className='font-mono text-foreground'>
                    SOCKS5 {lastSocks}
                  </span>
                </p>
              ) : null}

              <div className='flex gap-2'>
                <Input
                  id='telegram-v2ray-config'
                  dir='ltr'
                  type={showProxy ? 'text' : 'password'}
                  value={proxyConfig}
                  onChange={(e) => {
                    setProxyConfig(e.target.value)
                    if (e.target.value.trim()) setProxyPingOk(false)
                  }}
                  placeholder={
                    proxy?.configured
                      ? 'vless://uuid@host:port?…'
                      : 'vless://…'
                  }
                  className='font-mono text-sm'
                  autoComplete='off'
                />
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  className='shrink-0'
                  onClick={() => setShowProxy((v) => !v)}
                  aria-label={
                    showProxy ? 'مخفی کردن کانفیگ' : 'نمایش کانفیگ'
                  }
                >
                  {showProxy ? (
                    <EyeOff className='size-4' />
                  ) : (
                    <Eye className='size-4' />
                  )}
                </Button>
              </div>

              <div className='flex flex-wrap gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  disabled={
                    testingProxy ||
                    savingProxy ||
                    deletingProxy ||
                    (!proxyConfig.trim() && !proxy?.configured)
                  }
                  onClick={() => void handleTestProxy()}
                >
                  {testingProxy ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : null}
                  تست / پینگ
                </Button>
                <Button
                  type='button'
                  disabled={
                    savingProxy ||
                    testingProxy ||
                    deletingProxy ||
                    !canSaveProxy
                  }
                  onClick={() => void handleSaveProxy()}
                >
                  {savingProxy ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : null}
                  ذخیره و فعال‌سازی پروکسی
                </Button>
                {proxy?.configured ? (
                  <Button
                    type='button'
                    variant='outline'
                    className='border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive'
                    disabled={deletingProxy || savingProxy || testingProxy}
                    onClick={() => void handleDeleteProxy()}
                  >
                    {deletingProxy ? (
                      <Loader2 className='size-4 animate-spin' />
                    ) : (
                      <Trash2 className='size-4' />
                    )}
                    حذف پروکسی
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className='space-y-2'>
            <Label htmlFor={`token-${platform}`}>
              {isTelegram ? '۲. توکن بات' : 'توکن بات'}
            </Label>
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
                disabled={isTelegram && !proxyReady}
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
              {isTelegram && !proxyReady
                ? 'پس از پینگ و ذخیرهٔ موفق پروکسی، توکن را وارد کنید.'
                : TOKEN_FORMAT_DESCRIPTIONS[platform]}
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
            className={cn(
              'w-full sm:w-auto',
              !status.configured && 'sm:ms-auto'
            )}
            onClick={() => void handleSave()}
            disabled={saving || deleting || !canSaveToken}
          >
            {saving ? <Loader2 className='size-4 animate-spin' /> : null}
            {isTelegram ? 'ذخیره توکن' : 'ذخیره'}
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
