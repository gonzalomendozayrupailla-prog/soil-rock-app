import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tarea = await prisma.tarea.findUnique({
    where: { id },
    include: {
      asignado: { select: { id: true, nombre: true } },
      creador: { select: { id: true, nombre: true } },
      subtareas: { orderBy: { created_at: 'asc' } },
      comentarios: {
        include: { usuario: { select: { id: true, nombre: true } } },
        orderBy: { created_at: 'asc' },
      },
      proyecto: { select: { id: true, nombre: true, codigo: true } },
    },
  })
  if (!tarea) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(tarea)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (body.titulo !== undefined)       data.titulo = body.titulo
    if (body.descripcion !== undefined)  data.descripcion = body.descripcion
    if (body.seccion !== undefined)      data.seccion = body.seccion
    if (body.asignado_a !== undefined)   data.asignado_a = body.asignado_a
    if (body.fecha_limite !== undefined) data.fecha_limite = body.fecha_limite ? new Date(body.fecha_limite) : null
    if (body.estado !== undefined)       data.estado = body.estado
    if (body.prioridad !== undefined)    data.prioridad = body.prioridad
    if (body.orden !== undefined)        data.orden = body.orden

    const tarea = await prisma.tarea.update({
      where: { id },
      data,
      include: {
        asignado: { select: { id: true, nombre: true } },
        creador: { select: { id: true, nombre: true } },
        subtareas: { orderBy: { created_at: 'asc' } },
        comentarios: {
          include: { usuario: { select: { id: true, nombre: true } } },
          orderBy: { created_at: 'asc' },
        },
      },
    })
    return NextResponse.json(tarea)
  } catch (err) {
    console.error('[PATCH /api/tareas/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.tarea.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/tareas/[id]]', err)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
