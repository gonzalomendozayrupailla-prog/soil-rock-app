import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/app/lib/prisma'
import { signToken } from '@/app/lib/session'

export async function POST(req: NextRequest) {
  console.log('[api/login] request recibido')
  try {
    const { correo, password } = await req.json()
    console.log('[api/login] correo:', correo)

    const usuario = await prisma.usuario.findUnique({ where: { correo } })
    console.log('[api/login] usuario encontrado:', !!usuario)

    if (!usuario || !usuario.activo) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, usuario.password_hash)
    console.log('[api/login] password válido:', valid)

    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const token = await signToken({
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      permisos: usuario.permisos as Record<string, boolean>,
    })

    const res = NextResponse.json({ ok: true })
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    })
    console.log('[api/login] login exitoso para:', correo)
    return res
  } catch (err) {
    console.error('[api/login] ERROR:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
