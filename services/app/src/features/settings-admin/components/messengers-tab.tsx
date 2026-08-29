'use client'

import {
  IconBale,
  IconRubika,
  IconTelegram,
} from '@/assets/brand-icons'
import { TelegramBotEntry } from '@/components/messenger/telegram-bot-entry'
import type { MessengerPlatform, MessengerTokenStatus, NotificationDeliverySettings } from '../types'
import { MESSENGER_LABELS } from '../types'
import { MessengerTokenCard } from './messenger-token-card'

const MESSENGER_CONFIG: {
  platform: MessengerPlatform
  helpText: string
  helpUrl?: string
  icon: React.ReactNode
}[] = [
  {
    platform: 'telegram',
    helpText:
      'از @BotFather در تلگرام بات بسازید و توکن API را دریافت کنید.',
    helpUrl: 'https://t.me/BotFather',
    icon: <IconTelegram className='size-5' />,
  },
  {
    platform: 'bale',
    helpText:
      'از @BotFather در بله بات بسازید و توکن API را دریافت کنید.',
    helpUrl: 'https://ble.ir/BotFather',
    icon: <IconBale className='size-5' />,
  },
  {
    platform: 'rubika',
    helpText:
      'از پنل توسعه‌دهندگان روبیکا بات بسازید و توکن API را دریافت کنید.',
    icon: <IconRubika className='size-5' />,
  },
]

type MessengersTabProps = {
  messengers: MessengerTokenStatus[]
  onMessengerSaved: (
    status: MessengerTokenStatus,
    notificationDelivery?: NotificationDeliverySettings
  ) => void
}

export function MessengersTab({
  messengers,
  onMessengerSaved,
}: MessengersTabProps) {
  const statusByPlatform = new Map(
    messengers.map((m) => [m.platform, m])
  )
  const telegram = statusByPlatform.get('telegram')
  const telegramReady = Boolean(telegram?.configured && telegram.enabled)

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0 space-y-1'>
          <h2 className='text-base font-semibold tracking-tight text-sidebar-foreground'>
            پیام‌رسان‌ها
          </h2>
          <p className='text-sm text-muted-foreground'>
            توکن بات را ذخیره کنید و با دکمهٔ فعال‌سازی، چت‌بات را به سایت وصل کنید.
            پس از فعال‌سازی، ادمین، وکیل و موکل با لینک مستقیم تلگرام (بدون OTP)
            وارد بات می‌شوند.
          </p>
        </div>
        {telegramReady ? (
          <TelegramBotEntry
            key={`${telegram?.botUsername ?? ''}-${telegram?.enabled ? '1' : '0'}`}
            variant='compact'
            className='shrink-0 self-start'
          />
        ) : null}
      </div>

      <div className='space-y-4'>
        {MESSENGER_CONFIG.map((config) => {
          const status = statusByPlatform.get(config.platform) ?? {
            platform: config.platform,
            configured: false,
            enabled: false,
            hint: null,
            botUsername: null,
            webhookSetAt: null,
            updatedAt: null,
          }

          return (
            <MessengerTokenCard
              key={config.platform}
              platform={config.platform}
              label={MESSENGER_LABELS[config.platform]}
              icon={config.icon}
              helpText={config.helpText}
              helpUrl={config.helpUrl}
              status={status}
              onSaved={onMessengerSaved}
            />
          )
        })}
      </div>
    </div>
  )
}
