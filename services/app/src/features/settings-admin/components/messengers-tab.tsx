'use client'

import { IconBale, IconTelegram } from '@/assets/brand-icons'
// import { IconRubika } from '@/assets/brand-icons' // Rubika demo-gated
import { ChatbotEntries } from '@/components/messenger/chatbot-entries'
import { RUBIKA_CHATBOT_ENABLED } from '@/server/messenger/rubika/feature'
import type {
  MessengerPlatform,
  MessengerTokenStatus,
  NotificationDeliverySettings,
} from '../types'
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
      'ابتدا کانفیگ V2Ray وصل‌شونده را پینگ و ذخیره کنید، سپس از @BotFather توکن بات را بگیرید و ثبت کنید؛ بعد چت‌بات را فعال کنید.',
    helpUrl: 'https://t.me/BotFather',
    icon: <IconTelegram className='size-5' />,
  },
  {
    platform: 'bale',
    helpText:
      'از @BotFather در بله بات بسازید و توکن API را دریافت کنید. پروکسی لازم نیست.',
    helpUrl: 'https://ble.ir/BotFather',
    icon: <IconBale className='size-5' />,
  },
  // Rubika chatbot temporarily hidden from demo — re-enable via RUBIKA_CHATBOT_ENABLED
  // {
  //   platform: 'rubika',
  //   helpText:
  //     'از @BotFather در روبیکا بات بسازید و توکن API را دریافت کنید. پروکسی لازم نیست.',
  //   helpUrl: 'https://rubika.ir/botapi',
  //   icon: <IconRubika className='size-5' />,
  // },
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
  const bale = statusByPlatform.get('bale')
  const rubika = RUBIKA_CHATBOT_ENABLED
    ? statusByPlatform.get('rubika')
    : undefined
  const anyReady = [telegram, bale, rubika].some(
    (m) => m?.configured && m.enabled
  )
  const deepLinkRefreshKey = messengers
    .map((m) => `${m.platform}:${m.enabled ? 1 : 0}:${m.botUsername ?? ''}`)
    .join('|')

  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div className='space-y-1.5'>
          <h2 className='text-base font-semibold tracking-tight text-sidebar-foreground'>
            پیام‌رسان‌ها
          </h2>
          <p className='max-w-prose text-sm leading-relaxed text-muted-foreground'>
            توکن بات را ثبت و فعال کنید تا اعلان‌ها از طریق پیام‌رسان ارسال شوند.
          </p>
          <ul className='max-w-prose space-y-1 text-xs leading-relaxed text-muted-foreground/90'>
            <li className='flex gap-2'>
              <span
                className='mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50'
                aria-hidden
              />
              <span>
                تلگرام: ابتدا V2Ray را با پینگ موفق ذخیره کنید، سپس توکن را ثبت
                و چت‌بات را فعال کنید.
              </span>
            </li>
            <li className='flex gap-2'>
              <span
                className='mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50'
                aria-hidden
              />
              <span>بله: فقط ثبت توکن کافی است.</span>
            </li>
          </ul>
        </div>

        {anyReady ? (
          <div className='rounded-xl border border-sidebar-border bg-muted/20 px-4 py-3.5'>
            <div className='flex flex-col gap-3'>
              <div className='space-y-0.5'>
                <p className='text-sm font-medium text-sidebar-foreground'>
                  ورود مستقیم به چت‌بات
                </p>
                <p className='text-xs leading-relaxed text-muted-foreground'>
                  ادمین، وکیل و موکل با این لینک‌ها بدون OTP وارد بات می‌شوند.
                </p>
              </div>
              <ChatbotEntries
                variant='compact'
                className='w-full'
                refreshKey={deepLinkRefreshKey}
              />
            </div>
          </div>
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
            proxy:
              config.platform === 'telegram'
                ? {
                    configured: false,
                    hint: null,
                    running: false,
                    socksHost: null,
                    socksPort: null,
                  }
                : undefined,
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
