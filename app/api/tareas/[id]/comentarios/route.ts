import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/session'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id: tarea_id } = await params
    const { contenido } = await req.json()
    if (!contenido?.trim()) return NextResponse.json({ error: 'Contenido requerido' }, { status: 400 })

    let usuario_id = session.id
    const existe = await prisma.usuario.findUnique({ where: { id: usuario_id } })
    if (!existe) {
      const primero = await prisma.usuario.findFirst({ where: { activo: true } })
      if (!primero) return NextResponse.json({ error: 'Sin usuarios' }, { status: 500 })
      usuario_id = primero.id
    }

    const comentario = await prisma.comentarioTarea.create({
      data: { tarea_id, usuario_id, contenido: contenido.trim() },
      include: { usuario: { select: { id: true, nombre: true } } },
    })
    return NextResponse.json(comentario, { status: 201 })
  } catch (err) {
    console.error('[POST comentario tarea]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
