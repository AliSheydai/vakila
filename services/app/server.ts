import { createServer } from 'node:http'
import { parse } from 'node:url'
import next from 'next'
import { WebSocketServer } from 'ws'
import { getEnv } from './src/server/env'
import { PgListener } from './src/server/realtime/pg-listener'
import { WsHub } from './src/server/realtime/ws-hub'

const env = getEnv()
const port = Number(process.env.PORT) || 4000
const hostname = process.env.HOSTNAME || '0.0.0.0'
const dev = env.NODE_ENV !== 'production'

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

await app.prepare()

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url ?? '', true)
  void handle(req, res, parsedUrl)
})

const wss = new WebSocketServer({ noServer: true })
const hub = new WsHub(wss)
hub.startKeepalive()

server.on('upgrade', (request, socket, head) => {
  const { pathname } = parse(request.url ?? '')
  if (pathname === '/api/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request)
    })
    return
  }
  socket.destroy()
})

const listener = new PgListener()
listener.on((payload) => {
  void hub.handleDbChange(payload)
})

try {
  await listener.start()
} catch (error) {
  console.error('[server] PgListener failed to start:', error)
}

server.listen(port, hostname, () => {
  console.log(`> Ready on http://${hostname}:${port}`)
})

async function shutdown(): Promise<void> {
  hub.stopKeepalive()
  await listener.stop()
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()))
  })
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown()
})
process.on('SIGTERM', () => {
  void shutdown()
})
