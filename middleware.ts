import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { apiLimiter } from '@/app/lib/rate-limit'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

const PUBLIC_PATHS = ['/login', '/api/auth/logout', '/api/auth/google']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (pathname === '/login') {
    const token = req.cookies.get('token')?.value
    if (token) {
      try {
        await jwtVerify(token, secret, { algorithms: ['HS256'] })
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
      } catch {}
    }
    return NextResponse.next()
  }

  if (isPublic) return NextResponse.next()

  const isApiRoute = pathname.startsWith('/api/')
  const token = req.cookies.get('token')?.value

  if (!token) {
    if (isApiRoute) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
    const userId = payload.id as string

    if (!apiLimiter.check(userId)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intente en un momento.' },
        {
          status: 429,
          headers: { 'Retry-After': String(apiLimiter.retryAfter(userId)) },
        }
      )
    }

    return NextResponse.next()
  } catch {
    if (isApiRoute) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const res = NextResponse.redirect(new URL('/login', req.nextUrl))
    res.cookies.delete('token')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
