import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { signToken } from '@/app/lib/session'

interface GoogleTokenResponse {
  access_token: string
  token_type: string
}

interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(new URL('/login?error=google_denied', req.nextUrl))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=invalid_callback', req.nextUrl))
  }

  const storedState = req.cookies.get('oauth_state')?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', req.nextUrl))
  }

  const origin = req.nextUrl.origin

  try {
    // Intercambiar code por access_token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const body = await tokenRes.text()
      console.error('[Google OAuth] token_exchange failed', tokenRes.status, body)
      return NextResponse.redirect(new URL('/login?error=token_exchange', req.nextUrl))
    }

    const tokens: GoogleTokenResponse = await tokenRes.json()

    // Obtener datos del usuario de Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoRes.ok) {
      const body = await userInfoRes.text()
      console.error('[Google OAuth] userinfo failed', userInfoRes.status, body)
      return NextResponse.redirect(new URL('/login?error=userinfo', req.nextUrl))
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json()

    // Verificar que el correo existe en nuestra BD
    const usuario = await prisma.usuario.findUnique({
      where: { correo: googleUser.email },
    })

    if (!usuario || !usuario.activo) {
      console.error('[Google OAuth] no_access — email:', googleUser.email, 'usuario:', usuario)
      return NextResponse.redirect(new URL('/login?error=no_access', req.nextUrl))
    }

    // Guardar googleId / imagen en el primer login con Google
    if (!usuario.googleId || !usuario.imagen) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          ...(!usuario.googleId && { googleId: googleUser.id }),
          ...(!usuario.imagen && { imagen: googleUser.picture }),
        },
      })
    }

    const token = await signToken({
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      permisos: usuario.permisos as Record<string, boolean>,
    })

    const res = NextResponse.redirect(new URL('/dashboard', req.nextUrl))

    res.cookies.delete('oauth_state')
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    })

    return res
  } catch (err) {
    console.error('[Google OAuth callback]', err)
    return NextResponse.redirect(new URL('/login?error=internal', req.nextUrl))
  }
}
