import type { User, UserRole } from '../types'
import { getSessionTokenFromRequest } from './cookies'
import { getSessionUser } from './session'

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function requireUser(request: Request): Promise<User> {
  const token = getSessionTokenFromRequest(request)
  if (!token) {
    throw jsonError(401, 'Unauthorized')
  }

  const user = await getSessionUser(token)
  if (!user) {
    throw jsonError(401, 'Unauthorized')
  }

  return user
}

export function requireRole(user: User, roles: UserRole[]): void {
  if (!roles.includes(user.role)) {
    throw jsonError(403, 'Forbidden')
  }
}

export function isLawyerRole(role: UserRole): boolean {
  return role === 'super_admin' || role === 'lawyer'
}

export function isClientRole(role: UserRole): boolean {
  return role === 'client'
}
