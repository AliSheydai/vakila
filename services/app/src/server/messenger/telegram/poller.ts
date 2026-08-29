import type { BotApiPlatform } from '@/server/messenger/bot-platforms'
import * as settingsRepo from '@/server/repositories/settings-repo'
import { getUpdates } from './api'
import { handleBotUpdate } from './router'

type PollerState = {
  running: boolean
  loopPromise: Promise<void> | null
  offset: number
}

const pollers: Record<BotApiPlatform, PollerState> = {
  telegram: { running: false, loopPromise: null, offset: 0 },
  bale: { running: false, loopPromise: null, offset: 0 },
}

/**
 * Long-poll getUpdates when the bot is enabled without a public webhook
 * (typical local development with APP_URL=http://localhost:…).
 */
export function startBotPoller(platform: BotApiPlatform): void {
  const state = pollers[platform]
  if (state.running) return
  state.running = true
  state.loopPromise = runLoop(platform)
  console.log(`[${platform}-poller] started`)
}

export async function stopBotPoller(platform: BotApiPlatform): Promise<void> {
  const state = pollers[platform]
  state.running = false
  if (state.loopPromise) {
    await state.loopPromise.catch(() => undefined)
    state.loopPromise = null
  }
  console.log(`[${platform}-poller] stopped`)
}

export function startTelegramPoller(): void {
  startBotPoller('telegram')
}

export async function stopTelegramPoller(): Promise<void> {
  await stopBotPoller('telegram')
}

export function startBalePoller(): void {
  startBotPoller('bale')
}

export async function stopBalePoller(): Promise<void> {
  await stopBotPoller('bale')
}

export function startAllBotPollers(): void {
  startBotPoller('telegram')
  startBotPoller('bale')
}

export async function stopAllBotPollers(): Promise<void> {
  await Promise.all([stopBotPoller('telegram'), stopBotPoller('bale')])
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function runLoop(platform: BotApiPlatform): Promise<void> {
  const state = pollers[platform]
  while (state.running) {
    try {
      const ready = await settingsRepo.isMessengerReady(platform)
      if (!ready) {
        await sleep(5000)
        continue
      }

      // Webhook mode: platform delivers updates to /api/webhooks/{platform}
      const statuses = await settingsRepo.getMessengerTokensStatus()
      const status = statuses.find((s) => s.platform === platform)
      if (status?.webhookSetAt) {
        await sleep(10_000)
        continue
      }

      const token = await settingsRepo.getDecryptedMessengerToken(platform)
      if (!token) {
        await sleep(5000)
        continue
      }

      const updates = await getUpdates(platform, token, {
        offset: state.offset,
        timeout: 25,
        allowedUpdates: ['message', 'callback_query'],
      })

      for (const update of updates) {
        state.offset = update.update_id + 1
        try {
          await handleBotUpdate(platform, update)
        } catch (error) {
          console.error(`[${platform}-poller] update error`, error)
        }
      }
    } catch (error) {
      console.error(`[${platform}-poller] loop error`, error)
      await sleep(3000)
    }
  }
}
