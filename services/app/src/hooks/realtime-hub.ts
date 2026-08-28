'use client'

export type RealtimeDbEvent = {
  type: 'db'
  table: string
  op: 'INSERT' | 'UPDATE' | 'DELETE'
  id: string
  row?: Record<string, unknown>
  ts?: string
}

type Listener = (event: RealtimeDbEvent) => void

let socket: WebSocket | null = null
let closed = false
let retryTimer: ReturnType<typeof setTimeout> | null = null
let attempt = 0
let subscriberCount = 0
const listeners = new Set<Listener>()

function wsUrl(): string {
  if (typeof window === 'undefined') return ''
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/api/ws`
}

function emit(event: RealtimeDbEvent) {
  for (const listener of listeners) {
    listener(event)
  }
}

function connect() {
  if (closed || typeof window === 'undefined') return
  const url = wsUrl()
  if (!url) return

  socket = new WebSocket(url)

  socket.onopen = () => {
    attempt = 0
  }

  socket.onmessage = (message) => {
    try {
      const data = JSON.parse(String(message.data)) as {
        type?: string
        table?: string
        op?: string
        id?: string
        row?: Record<string, unknown>
        ts?: string
      }
      if (data?.type === 'db' && data.table && data.op && data.id) {
        emit({
          type: 'db',
          table: data.table,
          op: data.op as RealtimeDbEvent['op'],
          id: data.id,
          row: data.row,
          ts: data.ts,
        })
      }
    } catch {
      // ignore malformed payloads
    }
  }

  socket.onclose = () => {
    socket = null
    if (closed || subscriberCount === 0) return
    const delay = Math.min(30_000, 1000 * 2 ** attempt)
    attempt += 1
    retryTimer = setTimeout(connect, delay)
  }

  socket.onerror = () => {
    socket?.close()
  }
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  subscriberCount += 1

  if (subscriberCount === 1) {
    closed = false
    connect()
  }

  return () => {
    listeners.delete(listener)
    subscriberCount = Math.max(0, subscriberCount - 1)

    if (subscriberCount === 0) {
      closed = true
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      socket?.close()
      socket = null
    }
  }
}

export { subscribe as subscribeRealtime }
