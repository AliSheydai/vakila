import { NextResponse } from 'next/server'
import { toPublicUser, type PublicUser } from './serialize'

export type { PublicUser }
export { toPublicUser, toIso, toIsoRequired, num, maskPhone } from './serialize'

export type ApiOk<T> = { ok: true; data: T }
export type ApiErr = { ok: false; error: string }

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiOk<T>> {
  return NextResponse.json({ ok: true, data }, init)
}

export function fail(
  error: string,
  status = 400
): NextResponse<ApiErr> {
  return NextResponse.json({ ok: false, error }, { status })
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || null
  return request.headers.get('x-real-ip')
}

export function sanitizeError(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof Error) {
    const msg = error.message
    if (
      msg.includes('password') ||
      msg.includes('TOKEN') ||
      msg.includes('secret') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('database')
    ) {
      return fallback
    }
    return msg || fallback
  }
  return fallback
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

/** Catch requireUser Response throws and unknown errors. */
export async function withApiHandler(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof Response) {
      const body = await error.json().catch(() => ({ ok: false, error: 'Error' }))
      return NextResponse.json(body, { status: error.status })
    }
    return fail(sanitizeError(error), 500)
  }
}
