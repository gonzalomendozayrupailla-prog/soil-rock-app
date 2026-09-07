import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { Prisma } from '@/app/generated/prisma/client'
import { requireAuth } from '@/app/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error
    if (session.rol !== 'gerente') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (body.nombre !== undefined)   data.nombre = body.nombre
    if (body.rol !== undefined)      data.rol = body.rol
    if (body.activo !== undefined)   data.activo = body.activo
    if (body.permisos !== undefined) data.permisos = body.permisos

    const usuario = await prisma.usuario.update({
      where: { id },
      data,
      select: { id: true, nombre: true, correo: true, rol: true, permisos: true, activo: true, created_at: true },
    })
    return NextResponse.json(usuario)
  } catch (err) {
    console.error('[PATCH /api/usuarios/[id]]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error
    if (session.rol !== 'gerente') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    const { id } = await params

    if (id === session.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
    }

    await prisma.usuario.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/usuarios/[id]]', err)
    if (err instanceof Prisma.PrismaClientKnownRequestError && (err as Prisma.PrismaClientKnownRequestError).code === 'P2003') {
      return NextResponse.json(
        { error: 'No se puede eliminar: el usuario tiene proyectos, documentos o tareas asociados. Desactívalo en su lugar.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
