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
      return NextResponse.redirect(
        new URL(roleHome(claims.role), request.url)
      )
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
