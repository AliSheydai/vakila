import { ok, toIsoRequired, withApiHandler } from '@/server/api'
import { getSessionTokenFromRequest } from '@/server/auth/cookies'
import { verifySessionJwt } from '@/server/auth/jwt'
import { requireUser } from '@/server/auth/require-user'
import { hashToken } from '@/server/crypto'
import { listActiveSessions } from '@/server/repositories/sessions-repo'
import { parseUserAgent } from '@/lib/parse-user-agent'

export type PublicSession = {
  id: string
  browser: string
  device: string
  kind: 'desktop' | 'mobile' | 'tablet'
  ipAddress: string | null
  createdAt: string
  expiresAt: string
  current: boolean
}

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const user = await requireUser(request)
    const token = getSessionTokenFromRequest(request)
    const claims = token ? await verifySessionJwt(token) : null
    const currentHash = claims ? hashToken(claims.sid) : null

    const rows = await listActiveSessions(user.id)
    const sessions: PublicSession[] = rows.map((row) => {
      const parsed = parseUserAgent(row.user_agent)
      return {
        id: row.id,
        browser: parsed.browser,
        device: parsed.device,
        kind: parsed.kind,
        ipAddress: row.ip_address,
        createdAt: toIsoRequired(row.created_at),
        expiresAt: toIsoRequired(row.expires_at),
        current: currentHash !== null && row.token_hash === currentHash,
      }
    })

    return ok({ sessions })
  })
}
