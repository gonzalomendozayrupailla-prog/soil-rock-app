import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth(req)
    if (error) return error

    const { id: tarea_id } = await params
    const comentarios = await prisma.comentarioTarea.findMany({
      where: { tarea_id },
      include: { usuario: { select: { id: true, nombre: true } } },
      orderBy: { created_at: 'asc' },
    })
    return NextResponse.json(comentarios)
  } catch (err) {
    console.error('[GET comentarios tarea]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error

    const { id: tarea_id } = await params
    const { contenido } = await req.json()
    if (!contenido?.trim()) return NextResponse.json({ error: 'Contenido requerido' }, { status: 400 })

    const usuario_id = session.id
    const existe = await prisma.usuario.findUnique({ where: { id: usuario_id } })
    if (!existe) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

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
