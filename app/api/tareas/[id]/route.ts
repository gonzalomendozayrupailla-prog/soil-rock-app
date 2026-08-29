import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'

async function recalcularAvance(proyectoId: string) {
  const tareas = await prisma.tarea.findMany({
    where: { proyecto_id: proyectoId },
    select: { estado: true },
  })
  const total = tareas.length
  const completadas = tareas.filter((t) => t.estado === 'completada').length
  const avance = total > 0 ? Math.round((completadas / total) * 100) : 0
  await prisma.proyecto.update({ where: { id: proyectoId }, data: { avance_general: avance } })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

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
    const { session, error } = await requireAuth(req)
    if (error) return error

    const { id } = await params
    const body = await req.json()

    const tareaExistente = await prisma.tarea.findUnique({
      where: { id },
      select: { creado_por: true, asignado_a: true },
    })
    if (!tareaExistente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const canEdit = session.rol === 'gerente'
      || session.permisos['editar_proyectos'] === true
      || tareaExistente.creado_por === session.id
      || tareaExistente.asignado_a === session.id
    if (!canEdit) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

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
    if (body.estado !== undefined) {
      await recalcularAvance(tarea.proyecto_id)
    }
    return NextResponse.json(tarea)
  } catch (err) {
    console.error('[PATCH /api/tareas/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error

    const { id } = await params
    const tarea = await prisma.tarea.findUnique({
      where: { id },
      select: { proyecto_id: true, creado_por: true, asignado_a: true },
    })
    if (!tarea) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    const canDelete = session.rol === 'gerente'
      || session.permisos['editar_proyectos'] === true
      || tarea.creado_por === session.id
      || tarea.asignado_a === session.id
    if (!canDelete) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    await prisma.tarea.delete({ where: { id } })
    if (tarea) await recalcularAvance(tarea.proyecto_id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/tareas/[id]]', err)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
