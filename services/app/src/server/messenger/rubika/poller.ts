import * as settingsRepo from '@/server/repositories/settings-repo'
import { getUpdates } from './api'
import { handleRubikaUpdate } from './router'

type PollerState = {
  running: boolean
  loopPromise: Promise<void> | null
  offsetId: string | undefined
}

const state: PollerState = {
  running: false,
  loopPromise: null,
  offsetId: undefined,
}

/**
 * Poll getUpdates when Rubika is enabled without a public HTTPS webhook.
 */
export function startRubikaPoller(): void {
  if (state.running) return
  state.running = true
  state.loopPromise = runLoop()
  console.log('[rubika-poller] started')
}

export async function stopRubikaPoller(): Promise<void> {
  state.running = false
  if (state.loopPromise) {
    await state.loopPromise.catch(() => undefined)
    state.loopPromise = null
  }
  console.log('[rubika-poller] stopped')
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function runLoop(): Promise<void> {
  while (state.running) {
    try {
      const ready = await settingsRepo.isMessengerReady('rubika')
      if (!ready) {
        await sleep(5000)
        continue
      }

      const statuses = await settingsRepo.getMessengerTokensStatus()
      const status = statuses.find((s) => s.platform === 'rubika')
      if (status?.webhookSetAt) {
        await sleep(10_000)
        continue
      }

      const token = await settingsRepo.getDecryptedMessengerToken('rubika')
      if (!token) {
        await sleep(5000)
        continue
      }

      const result = await getUpdates(token, {
        offsetId: state.offsetId,
        limit: 100,
      })

      if (result.next_offset_id) {
        state.offsetId = result.next_offset_id
      }

      for (const update of result.updates ?? []) {
        try {
          await handleRubikaUpdate(update)
        } catch (error) {
          console.error('[rubika-poller] update error', error)
        }
      }

      // Rubika getUpdates is not long-poll; pace requests.
      if (!result.updates?.length) await sleep(3000)
    } catch (error) {
      console.error('[rubika-poller] loop error', error)
      await sleep(3000)
    }
  }
}
