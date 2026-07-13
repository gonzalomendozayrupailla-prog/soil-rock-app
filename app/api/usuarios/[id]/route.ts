import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/session'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const session = await verifyToken(token)
    if (!session || session.rol !== 'gerente') {
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
