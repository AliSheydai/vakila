'use client'

import { useEffect, useState } from 'react'
import {
  Bell,
  Bot,
  Globe,
  Loader2,
  MessageSquare,
  TriangleAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import {
  IconBale,
  IconRubika,
  IconTelegram,
} from '@/assets/brand-icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type {
  ClientNotificationChannel,
  MessengerPlatform,
  MessengerTokenStatus,
  NotificationDeliverySettings,
} from '../types'
import { CHANNEL_LABELS, MESSENGER_LABELS } from '../types'

const MESSENGER_ICONS: Record<MessengerPlatform, React.ReactNode> = {
  telegram: <IconTelegram className='size-4' />,
  bale: <IconBale className='size-4' />,
  rubika: <IconRubika className='size-4' />,
}

const PLATFORMS: MessengerPlatform[] = ['telegram', 'bale', 'rubika']

function getAvailablePlatforms(messengers: MessengerTokenStatus[]) {
  return new Set(
    messengers
      .filter((m) => m.configured && m.enabled)
      .map((m) => m.platform)
  )
}

type NotificationsTabProps = {
  settings: NotificationDeliverySettings
  messengers: MessengerTokenStatus[]
  smsConfigured: boolean
  onSaved: (settings: NotificationDeliverySettings) => void
}

function ChannelOption({
  value,
  id,
  icon,
  title,
  description,
  selected,
}: {
  value: string
  id: string
  icon: React.ReactNode
  title: string
  description: string
  selected: boolean
}) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-sidebar-border hover:bg-muted/50'
      )}
    >
      <RadioGroupItem value={value} id={id} className='mt-0.5' />
      <div className='flex flex-1 items-start gap-3'>
        <div className='mt-0.5 text-muted-foreground'>{icon}</div>
        <div className='space-y-1'>
          <p className='text-sm font-medium leading-none'>{title}</p>
          <p className='text-xs leading-relaxed text-muted-foreground'>
            {description}
          </p>
        </div>
      </div>
    </Label>
  )
}

export function NotificationsTab({
  settings,
  messengers,
  smsConfigured,
  onSaved,
}: NotificationsTabProps) {
  const [channel, setChannel] = useState<ClientNotificationChannel>(
    settings.clientChannel
  )
  const [chatbotPlatform, setChatbotPlatform] = useState<MessengerPlatform | ''>(
    settings.clientChatbotPlatform ?? ''
  )
  const [saving, setSaving] = useState(false)

  const availablePlatforms = getAvailablePlatforms(messengers)

  useEffect(() => {
    setChannel(settings.clientChannel)
    setChatbotPlatform(settings.clientChatbotPlatform ?? '')
  }, [settings])

  useEffect(() => {
    if (chatbotPlatform && !availablePlatforms.has(chatbotPlatform)) {
      setChatbotPlatform('')
    }
  }, [availablePlatforms, chatbotPlatform])

  const savedDeliveryInvalid =
    settings.clientChannel === 'chatbot' &&
    settings.clientChatbotPlatform != null &&
    !availablePlatforms.has(settings.clientChatbotPlatform)

  async function handleSave() {
    if (channel === 'chatbot' && !chatbotPlatform) {
      toast.error('لطفاً پیام‌رسان چت‌بات را انتخاب کنید.')
      return
    }

    setSaving(true)
    const result = await api<{ notificationDelivery: NotificationDeliverySettings }>(
      '/api/settings/notification-delivery',
      {
        method: 'PATCH',
        body: {
          clientChannel: channel,
          clientChatbotPlatform:
            channel === 'chatbot' ? chatbotPlatform : null,
        },
      }
    )
    setSaving(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    onSaved(result.data.notificationDelivery)
    setChannel(result.data.notificationDelivery.clientChannel)
    setChatbotPlatform(
      result.data.notificationDelivery.clientChatbotPlatform ?? ''
    )
    toast.success('تنظیمات اعلان‌ها ذخیره شد.')
  }

  const isDirty =
    channel !== settings.clientChannel ||
    (channel === 'chatbot' &&
      chatbotPlatform !== (settings.clientChatbotPlatform ?? ''))

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-base font-semibold tracking-tight text-sidebar-foreground'>
          اعلان‌ها
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          نحوه اطلاع‌رسانی به موکل را مشخص کنید تا بدون نیاز به مراجعه مداوم به
          پورتال، از رویدادهای پرونده مطلع شود.
        </p>
      </div>

      {savedDeliveryInvalid ? (
        <Alert className='border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200'>
          <TriangleAlert className='text-amber-600 dark:text-amber-400' />
          <AlertTitle>تنظیم اعلان نامعتبر است</AlertTitle>
          <AlertDescription>
            پیام‌رسان ذخیره‌شده برای چت‌بات دیگر فعال نیست یا توکن ندارد. لطفاً
            یک پیام‌رسان دیگر انتخاب کنید یا کانال را تغییر دهید و ذخیره کنید.
          </AlertDescription>
        </Alert>
      ) : null}

      {channel === 'sms' && !smsConfigured ? (
        <Alert className='border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200'>
          <TriangleAlert className='text-amber-600 dark:text-amber-400' />
          <AlertTitle>درگاه پیامک پیکربندی نشده</AlertTitle>
          <AlertDescription>
            ارسال پیامک نیاز به تنظیم درگاه Ferzz در سرور دارد. تا زمان
            پیکربندی، اعلان‌ها فقط داخل پورتال نمایش داده می‌شوند.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className='space-y-4'>
        <Label className='text-sm font-medium'>کانال ارسال اعلان به موکل</Label>

        <RadioGroup
          value={channel}
          onValueChange={(v) => setChannel(v as ClientNotificationChannel)}
          className='gap-3'
        >
          <ChannelOption
            value='in_app'
            id='channel-in-app'
            icon={<Globe className='size-4' />}
            title={CHANNEL_LABELS.in_app}
            description='موکل فقط از طریق پورتال و اعلان‌های داخل سایت مطلع می‌شود.'
            selected={channel === 'in_app'}
          />
          <ChannelOption
            value='sms'
            id='channel-sms'
            icon={<MessageSquare className='size-4' />}
            title={CHANNEL_LABELS.sms}
            description='اعلان‌ها به شماره موبایل موکل از طریق پیامک ارسال می‌شود.'
            selected={channel === 'sms'}
          />
          <ChannelOption
            value='chatbot'
            id='channel-chatbot'
            icon={<Bot className='size-4' />}
            title={CHANNEL_LABELS.chatbot}
            description='اعلان‌ها از طریق چت‌بات پیام‌رسان انتخاب‌شده به موکل ارسال می‌شود.'
            selected={channel === 'chatbot'}
          />
        </RadioGroup>
      </div>

      {channel === 'chatbot' ? (
        <div className='space-y-3 rounded-xl border border-sidebar-border bg-muted/30 p-4'>
          <Label className='text-sm font-medium'>پیام‌رسان چت‌بات</Label>
          <TooltipProvider delayDuration={200}>
            <RadioGroup
              value={chatbotPlatform}
              onValueChange={(v) =>
                setChatbotPlatform(v as MessengerPlatform)
              }
              className='gap-2'
            >
              {PLATFORMS.map((platform) => {
                const available = availablePlatforms.has(platform)
                const item = (
                  <Label
                    htmlFor={`platform-${platform}`}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                      !available && 'cursor-not-allowed opacity-50',
                      chatbotPlatform === platform
                        ? 'border-primary bg-primary/5'
                        : 'border-sidebar-border hover:bg-muted/50'
                    )}
                  >
                    <RadioGroupItem
                      value={platform}
                      id={`platform-${platform}`}
                      disabled={!available}
                    />
                    <span className='text-muted-foreground'>
                      {MESSENGER_ICONS[platform]}
                    </span>
                    <span className='text-sm font-medium'>
                      {MESSENGER_LABELS[platform]}
                    </span>
                  </Label>
                )

                if (!available) {
                  return (
                    <Tooltip key={platform}>
                      <TooltipTrigger asChild>
                        <div>{item}</div>
                      </TooltipTrigger>
                      <TooltipContent side='top'>
                        توکن را ثبت کنید و چت‌بات را در تب پیام‌رسان‌ها فعال
                        کنید
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return <div key={platform}>{item}</div>
              })}
            </RadioGroup>
          </TooltipProvider>
        </div>
      ) : null}

      <div className='flex items-center gap-2 rounded-lg border border-dashed border-sidebar-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground'>
        <Bell className='size-4 shrink-0' />
        <p>
          اعلان‌های داخل پورتال همیشه فعال هستند. این تنظیم فقط نحوه اطلاع‌رسانی
          خارج از سایت را مشخص می‌کند.
        </p>
      </div>

      <div className='flex justify-end'>
        <Button
          type='button'
          onClick={() => void handleSave()}
          disabled={saving || !isDirty}
        >
          {saving ? <Loader2 className='size-4 animate-spin' /> : null}
          ذخیره تنظیمات
        </Button>
      </div>
    </div>
  )
}
