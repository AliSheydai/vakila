import pg from 'pg'
import { getEnv } from '../env'
import type { DbChangePayload } from '../types'

export type PgChangeHandler = (payload: DbChangePayload) => void | Promise<void>

const CHANNEL = 'vakila_changes'

export class PgListener {
  private client: pg.Client | null = null
  private handlers = new Set<PgChangeHandler>()
  private stopped = true
  private reconnectAttempt = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  on(handler: PgChangeHandler): () => void {
    this.handlers.add(handler)
    return () => {
      this.handlers.delete(handler)
    }
  }

  async start(): Promise<void> {
    this.stopped = false
    await this.connect()
  }

  async stop(): Promise<void> {
    this.stopped = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    await this.disconnect()
  }

  private async connect(): Promise<void> {
    if (this.stopped) return

    await this.disconnect()

    const client = new pg.Client({ connectionString: getEnv().DATABASE_URL })
    this.client = client

    client.on('notification', (msg) => {
      if (msg.channel !== CHANNEL || !msg.payload) return
      try {
        const payload = JSON.parse(msg.payload) as DbChangePayload
        for (const handler of this.handlers) {
          void Promise.resolve(handler(payload)).catch((error) => {
            console.error('[PgListener] handler error:', error)
          })
        }
      } catch (error) {
        console.error('[PgListener] failed to parse notification:', error)
      }
    })

    client.on('error', (error) => {
      console.error('[PgListener] connection error:', error.message)
      void this.scheduleReconnect()
    })

    client.on('end', () => {
      if (!this.stopped) {
        void this.scheduleReconnect()
      }
    })

    await client.connect()
    await client.query(`LISTEN ${CHANNEL}`)
    this.reconnectAttempt = 0
    console.log(`[PgListener] listening on ${CHANNEL}`)
  }

  private async disconnect(): Promise<void> {
    const client = this.client
    this.client = null
    if (!client) return
    try {
      client.removeAllListeners()
      await client.end()
    } catch {
      // ignore shutdown errors
    }
  }

  private async scheduleReconnect(): Promise<void> {
    if (this.stopped || this.reconnectTimer) return

    const delay = Math.min(30_000, 1000 * 2 ** this.reconnectAttempt)
    this.reconnectAttempt += 1
    console.log(`[PgListener] reconnecting in ${delay}ms…`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.connect().catch((error) => {
        console.error('[PgListener] reconnect failed:', error)
        void this.scheduleReconnect()
      })
    }, delay)
  }
}
