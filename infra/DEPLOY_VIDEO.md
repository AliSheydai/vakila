# Deploying Video Calls (LiveKit + coturn)

## Required ports

| Service | Protocol | Port | Purpose |
|---------|----------|------|---------|
| LiveKit | TCP | 7880 | HTTP / WebSocket signaling |
| LiveKit | TCP | 7881 | WebRTC over TCP |
| LiveKit | UDP | 7882 | WebRTC media |
| LiveKit | UDP | 50000–50100 | RTC port range (see `livekit.yaml`) |
| coturn | UDP/TCP | 3478 | TURN |
| coturn | TCP | 5349 | TURN TLS |

Open these on your firewall and cloud security group.

## Environment variables

Set in `services/app/.env` (and docker-compose `app` service):

```env
LIVEKIT_URL=ws://livekit:7880          # server-side (docker network)
LIVEKIT_PUBLIC_URL=wss://your-domain/livekit  # browser WebSocket (production)
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=vakila_livekit_secret_change_in_production
TURN_HOST=your-domain.com
TURN_SECRET=vakila_turn_secret_change_in_production
APP_URL=https://your-domain.com
COOKIE_SECURE=true
```

For local development:

```env
LIVEKIT_URL=ws://127.0.0.1:7880
LIVEKIT_PUBLIC_URL=ws://127.0.0.1:7880
```

## Production checklist

1. Replace API keys and TURN secret in `infra/livekit.yaml` and `infra/coturn.conf`.
2. Set `rtc.use_external_ip: true` and configure `node_ip` in LiveKit config.
3. Use HTTPS for `APP_URL` — browsers require secure context for camera/mic.
4. Put LiveKit behind reverse proxy with WebSocket upgrade support, or expose `LIVEKIT_PUBLIC_URL` directly.
5. Run `./run.sh prod` or `docker compose up -d` including `livekit` and `coturn` services.
6. Run migrations: `npm run migrate` in `services/app`.

## Health checks

- LiveKit: `curl http://localhost:7880`
- App video token: authenticated `GET /api/events/{eventId}/video-token`

## Rate limiting

Video token endpoint is limited to 30 requests per user per 10 minutes (in-memory; use Redis for multi-instance deployments).
