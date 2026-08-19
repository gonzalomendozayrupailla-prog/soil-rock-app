import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function GET(req: NextRequest) {
  const state = randomBytes(16).toString('hex')
  const origin = req.nextUrl.origin

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  })

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  )
  res.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })

  return res
}
