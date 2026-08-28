import type { IncomingMessage } from 'node:http'
import { parse as parseUrl } from 'node:url'
import type { WebSocket, WebSocketServer } from 'ws'
import { parseCookies } from '../auth/cookies'
import { SESSION_COOKIE, getSessionUser } from '../auth/session'
import { query } from '../db'
import type { DbChangePayload } from '../types'

type AuthenticatedSocket = WebSocket & {
  userId?: string
  isAlive?: boolean
}

export class WsHub {
  private socketsByUser = new Map<string, Set<AuthenticatedSocket>>()
  private pingTimer: ReturnType<typeof setInterval> | null = null

  constructor(private readonly wss: WebSocketServer) {
    this.wss.on('connection', (socket, request) => {
      void this.handleConnection(socket as AuthenticatedSocket, request)
    })
  }

  startKeepalive(intervalMs = 30_000): void {
    if (this.pingTimer) return
    this.pingTimer = setInterval(() => {
      for (const set of this.socketsByUser.values()) {
        for (const socket of set) {
          if (socket.isAlive === false) {
            socket.terminate()
            continue
          }
          socket.isAlive = false
          if (socket.readyState === socket.OPEN) {
            socket.ping()
          }
        }
      }
    }, intervalMs)
  }

  stopKeepalive(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  async handleDbChange(payload: DbChangePayload): Promise<void> {
    const userIds = await this.resolveRecipients(payload)
    if (userIds.size === 0) return

    const message = JSON.stringify({ type: 'db', ...payload })
    for (const userId of userIds) {
      this.sendToUser(userId, message)
    }
  }

  private async handleConnection(
    socket: AuthenticatedSocket,
    request: IncomingMessage
  ): Promise<void> {
    try {
      const token = this.extractToken(request)
      if (!token) {
        socket.close(4401, 'Unauthorized')
        return
      }

      const user = await getSessionUser(token)
      if (!user) {
        socket.close(4401, 'Unauthorized')
        return
      }

      socket.userId = user.id
      socket.isAlive = true

      let set = this.socketsByUser.get(user.id)
      if (!set) {
        set = new Set()
        this.socketsByUser.set(user.id, set)
      }
      set.add(socket)

      socket.on('pong', () => {
        socket.isAlive = true
      })

      socket.on('message', (data) => {
        const text = typeof data === 'string' ? data : data.toString()
        if (text === 'ping') {
          socket.send('pong')
        }
      })

      socket.on('close', () => {
        this.removeSocket(socket)
      })

      socket.on('error', () => {
        this.removeSocket(socket)
      })
    } catch {
      socket.close(4401, 'Unauthorized')
    }
  }

  private extractToken(request: IncomingMessage): string | null {
    const cookies = parseCookies(request.headers.cookie ?? null)
    if (cookies[SESSION_COOKIE]) return cookies[SESSION_COOKIE]

    const { query } = parseUrl(request.url ?? '', true)
    const token = query.token
    if (typeof token === 'string' && token.length > 0) return token
    return null
  }

  private removeSocket(socket: AuthenticatedSocket): void {
    const userId = socket.userId
    if (!userId) return
    const set = this.socketsByUser.get(userId)
    if (!set) return
    set.delete(socket)
    if (set.size === 0) {
      this.socketsByUser.delete(userId)
    }
  }

  private sendToUser(userId: string, message: string): void {
    const set = this.socketsByUser.get(userId)
    if (!set) return
    for (const socket of set) {
      if (socket.readyState === socket.OPEN) {
        socket.send(message)
      }
    }
  }

  private async resolveRecipients(
    payload: DbChangePayload
  ): Promise<Set<string>> {
    const recipients = new Set<string>()
    const row = payload.row ?? {}

    const add = (value: unknown) => {
      if (typeof value === 'string' && value.length > 0) {
        recipients.add(value)
      }
    }

    add(row.owner_id)
    add(row.client_user_id)
    add(row.linked_user_id)
    add(row.uploaded_by)
    add(row.author_id)

    if (payload.table === 'users') {
      add(row.id)
      const { rows } = await query<{ id: string }>(
        `SELECT id FROM users WHERE role = 'super_admin' AND is_active = TRUE`
      )
      for (const r of rows) recipients.add(r.id)
      return recipients
    }

    if (payload.table === 'case_comments' || payload.table === 'case_timeline') {
      const caseId = row.case_id
      if (typeof caseId === 'string') {
        const { rows } = await query<{
          owner_id: string
          client_user_id: string | null
        }>(`SELECT owner_id, client_user_id FROM cases WHERE id = $1`, [caseId])
        if (rows[0]) {
          add(rows[0].owner_id)
          add(rows[0].client_user_id)
        }
      }
    }

    if (
      payload.table === 'case_fees' ||
      payload.table === 'case_expenses' ||
      payload.table === 'attachments'
    ) {
      const caseId = row.case_id
      if (typeof caseId === 'string') {
        const { rows } = await query<{
          owner_id: string
          client_user_id: string | null
        }>(`SELECT owner_id, client_user_id FROM cases WHERE id = $1`, [caseId])
        if (rows[0]) {
          add(rows[0].owner_id)
          add(rows[0].client_user_id)
        }
      }

      const clientId = row.client_id
      if (typeof clientId === 'string') {
        const { rows } = await query<{
          owner_id: string
          linked_user_id: string | null
        }>(
          `SELECT owner_id, linked_user_id FROM clients WHERE id = $1`,
          [clientId]
        )
        if (rows[0]) {
          add(rows[0].owner_id)
          add(rows[0].linked_user_id)
        }
      }
    }

    return recipients
  }
}
