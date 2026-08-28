import type { NextResponse } from 'next/server'
import { getEnv } from '../env'
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from './constants'

export type CookieOptions = {
  maxAge?: number
  secure?: boolean
}

function buildCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): string {
  const env = getEnv()
  const maxAge = options.maxAge ?? SESSION_TTL_SECONDS
  const secure = options.secure ?? env.COOKIE_SECURE

  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]

  if (secure) {
    parts.push('Secure')
  }

  return parts.join('; ')
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  options?: CookieOptions
): void {
  response.headers.append(
    'Set-Cookie',
    buildCookie(SESSION_COOKIE, token, options)
  )
}

export function clearSessionCookie(response: NextResponse): void {
  response.headers.append(
    'Set-Cookie',
    buildCookie(SESSION_COOKIE, '', { maxAge: 0 })
  )
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}
  const out: Record<string, string> = {}
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const value = part.slice(idx + 1).trim()
    if (!key) continue
    try {
      out[key] = decodeURIComponent(value)
    } catch {
      out[key] = value
    }
  }
  return out
}

export function getSessionTokenFromRequest(request: Request): string | null {
  const cookies = parseCookies(request.headers.get('cookie'))
  return cookies[SESSION_COOKIE] ?? null
}
