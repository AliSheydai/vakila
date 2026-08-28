import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import type { UserRole } from '../types'
import { SESSION_TTL_SECONDS } from './constants'

export type SessionJwtClaims = {
  sub: string
  role: UserRole
  /** Opaque session token — hashed for DB revocation checks */
  sid: string
}

export type SessionJwtPayload = SessionJwtClaims & JWTPayload

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET is missing or too short')
  }
  return new TextEncoder().encode(secret)
}

export async function signSessionJwt(input: {
  userId: string
  role: UserRole
  sid: string
  expiresAt?: Date
}): Promise<string> {
  const expiresAt =
    input.expiresAt ?? new Date(Date.now() + SESSION_TTL_SECONDS * 1000)

  return new SignJWT({
    role: input.role,
    sid: input.sid,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecretKey())
}

/** Edge-safe verify — signature + exp only (no DB). */
export async function verifySessionJwt(
  token: string
): Promise<SessionJwtClaims | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    })
    const sub = payload.sub
    const role = payload.role
    const sid = payload.sid
    if (
      typeof sub !== 'string' ||
      typeof sid !== 'string' ||
      (role !== 'super_admin' && role !== 'lawyer' && role !== 'client')
    ) {
      return null
    }
    return { sub, role, sid }
  } catch {
    return null
  }
}
