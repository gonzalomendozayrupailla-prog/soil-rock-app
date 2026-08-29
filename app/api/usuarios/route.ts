import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error
    if (session.rol !== 'gerente') {
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
    const { session, error } = await requireAuth(req)
    if (error) return error
    if (session.rol !== 'gerente') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    const body = await req.json()
    if (!body.nombre || !body.correo || !body.rol) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const existe = await prisma.usuario.findUnique({ where: { correo: body.correo } })
    if (existe) return NextResponse.json({ error: 'El correo ya esta en uso' }, { status: 409 })

    const permisos = body.permisos ?? {
      ver_proyectos: true,
      editar_proyectos: false,
      ver_documentos: true,
      subir_documentos: false,
      ver_reportes_campo: true,
      editar_reportes_campo: false,
      ver_dashboard: true,
      ver_montos: false,
      ver_comercial: true,
      ver_clientes: true,
    }

    const usuario = await prisma.usuario.create({
      data: {
        nombre: body.nombre,
        correo: body.correo,
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
