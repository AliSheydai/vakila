import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/server/auth/constants'
import { verifySessionJwt } from '@/server/auth/jwt'

const AUTH_PAGES = new Set([
  '/sign-in',
  '/sign-up',
  '/login',
  '/otp',
  '/forgot-password',
  '/sign-in-2',
])

const CLIENT_PREFIXES = ['/dashboard', '/cases', '/sessions', '/payments']

function isStaticOrPublic(pathname: string): boolean {
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|map|txt|woff2?)$/)
  ) {
    return true
  }
  if (pathname === '/') return true
  if (pathname.startsWith('/api/auth/otp')) return true
  if (pathname.startsWith('/api/ws')) return true
  return false
}

function roleHome(role: string): string {
  if (role === 'lawyer' || role === 'super_admin') return '/admin'
  return '/dashboard'
}

function isLawyer(role: string): boolean {
  return role === 'lawyer' || role === 'super_admin'
}

function resolvePostAuthRedirect(role: string, next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return roleHome(role)
  }

  const isAdminPath = next === '/admin' || next.startsWith('/admin/')
  const isClientPath =
    next === '/dashboard' ||
    next.startsWith('/dashboard/') ||
    next.startsWith('/cases') ||
    next.startsWith('/sessions') ||
    next.startsWith('/payments')

  if (role === 'client' && isAdminPath) return '/dashboard'
  if (isLawyer(role) && isClientPath) {
    if (next.startsWith('/cases')) return '/admin/cases'
    return '/admin'
  }
  return next
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isStaticOrPublic(pathname)) {
    return NextResponse.next()
  }

  // Other API routes — auth checked in handlers (DB verify)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const claims = token ? await verifySessionJwt(token) : null

  const isAuthPage =
    AUTH_PAGES.has(pathname) ||
    [...AUTH_PAGES].some((p) => pathname.startsWith(`${p}/`))

  if (isAuthPage) {
    if (claims) {
      const next =
        request.nextUrl.searchParams.get('next') ||
        request.nextUrl.searchParams.get('redirect')
      const target = resolvePostAuthRedirect(claims.role, next)
      return NextResponse.redirect(new URL(target, request.url))
    }
    return NextResponse.next()
  }

  if (!claims) {
    const signIn = new URL('/sign-in', request.url)
    signIn.searchParams.set('next', pathname)
    return NextResponse.redirect(signIn)
  }

  if (pathname.startsWith('/admin/users')) {
    if (claims.role !== 'super_admin') {
      return NextResponse.redirect(new URL(roleHome(claims.role), request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin/settings')) {
    if (claims.role !== 'super_admin') {
      return NextResponse.redirect(new URL(roleHome(claims.role), request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) {
    if (!isLawyer(claims.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (CLIENT_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (isLawyer(claims.role)) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next internals and static files already filtered
     * in code; keep matcher broad so auth redirects apply.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
