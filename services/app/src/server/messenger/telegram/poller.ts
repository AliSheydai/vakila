import * as settingsRepo from '@/server/repositories/settings-repo'
import { getUpdates } from './api'
import { handleTelegramUpdate } from './router'

let running = false
let loopPromise: Promise<void> | null = null
let offset = 0

/**
 * Long-poll Telegram getUpdates when the bot is enabled without a public webhook
 * (typical local development with APP_URL=http://localhost:…).
 */
export function startTelegramPoller(): void {
  if (running) return
  running = true
  loopPromise = runLoop()
  console.log('[telegram-poller] started')
}

export async function stopTelegramPoller(): Promise<void> {
  running = false
  if (loopPromise) {
    await loopPromise.catch(() => undefined)
    loopPromise = null
  }
  console.log('[telegram-poller] stopped')
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function runLoop(): Promise<void> {
  while (running) {
    try {
      const ready = await settingsRepo.isMessengerReady('telegram')
      if (!ready) {
        await sleep(5000)
        continue
      }

      // Webhook mode: Telegram delivers updates to /api/webhooks/telegram
      const statuses = await settingsRepo.getMessengerTokensStatus()
      const tg = statuses.find((s) => s.platform === 'telegram')
      if (tg?.webhookSetAt) {
        await sleep(10_000)
        continue
      }

      const token = await settingsRepo.getDecryptedMessengerToken('telegram')
      if (!token) {
        await sleep(5000)
        continue
      }

      const updates = await getUpdates(token, {
        offset,
        timeout: 25,
        allowedUpdates: ['message', 'callback_query'],
      })

      for (const update of updates) {
        offset = update.update_id + 1
        try {
          await handleTelegramUpdate(update)
        } catch (error) {
          console.error('[telegram-poller] update error', error)
        }
      }
    } catch (error) {
      console.error('[telegram-poller] loop error', error)
      await sleep(3000)
    }
  }
}
