import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout']

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

  const token = req.cookies.get('token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  try {
    await jwtVerify(token, secret, { algorithms: ['HS256'] })
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.nextUrl))
    res.cookies.delete('token')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
