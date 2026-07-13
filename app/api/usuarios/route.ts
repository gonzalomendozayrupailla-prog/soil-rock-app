import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/session'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const session = await verifyToken(token)
    if (!session || session.rol !== 'gerente') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, correo: true, rol: true, permisos: true, activo: true, created_at: true },
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json(usuarios)
  } catch (err) {
    console.error('[GET /api/usuarios]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const session = await verifyToken(token)
    if (!session || session.rol !== 'gerente') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    const body = await req.json()
    if (!body.nombre || !body.correo || !body.password || !body.rol) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const existe = await prisma.usuario.findUnique({ where: { correo: body.correo } })
    if (existe) return NextResponse.json({ error: 'El correo ya esta en uso' }, { status: 409 })

    const password_hash = await bcrypt.hash(body.password, 12)

    const permisos = body.permisos ?? {
      ver_proyectos: true,
      editar_proyectos: false,
      ver_documentos: true,
      subir_documentos: false,
      ver_reportes_campo: true,
      editar_reportes_campo: false,
      ver_valorizaciones: true,
      editar_valorizaciones: false,
      ver_facturas: false,
      ver_garantias: false,
      ver_dashboard: true,
      ver_montos: false,
    }

    const usuario = await prisma.usuario.create({
      data: {
        nombre: body.nombre,
        correo: body.correo,
        password_hash,
        rol: body.rol,
        permisos,
      },
      select: { id: true, nombre: true, correo: true, rol: true, permisos: true, activo: true, created_at: true },
    })

    return NextResponse.json(usuario, { status: 201 })
  } catch (err) {
    console.error('[POST /api/usuarios]', err)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
