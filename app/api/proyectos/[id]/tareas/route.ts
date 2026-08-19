import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/session'
import { requireAuth } from '@/app/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { id } = await params
  const tareas = await prisma.tarea.findMany({
    where: { proyecto_id: id },
    include: {
      asignado: { select: { id: true, nombre: true } },
      creador: { select: { id: true, nombre: true } },
      subtareas: { orderBy: { created_at: 'asc' } },
      comentarios: {
        include: { usuario: { select: { id: true, nombre: true } } },
        orderBy: { created_at: 'asc' },
      },
    },
    orderBy: [{ seccion: 'asc' }, { orden: 'asc' }, { created_at: 'asc' }],
  })
  return NextResponse.json(tareas)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id: proyecto_id } = await params
    const body = await req.json()

    if (!body.titulo?.trim()) {
      return NextResponse.json({ error: 'El titulo es requerido' }, { status: 400 })
    }

    let creado_por = session.id
    const usuarioExiste = await prisma.usuario.findUnique({ where: { id: creado_por } })
    if (!usuarioExiste) {
      const primero = await prisma.usuario.findFirst({ where: { activo: true } })
      if (!primero) return NextResponse.json({ error: 'No hay usuarios' }, { status: 500 })
      creado_por = primero.id
    }

    const tarea = await prisma.tarea.create({
      data: {
        proyecto_id,
        titulo: body.titulo.trim(),
        descripcion: body.descripcion?.trim() || null,
        seccion: body.seccion || 'Sin seccion',
        asignado_a: body.asignado_a || null,
        creado_por,
        fecha_limite: body.fecha_limite ? new Date(body.fecha_limite) : null,
        estado: body.estado || 'pendiente',
        prioridad: body.prioridad || 'media',
      },
      include: {
        asignado: { select: { id: true, nombre: true } },
        creador: { select: { id: true, nombre: true } },
        subtareas: true,
        comentarios: { include: { usuario: { select: { id: true, nombre: true } } } },
      },
    })

    // Recalcular avance_general al agregar tarea
    const todasTareas = await prisma.tarea.findMany({
      where: { proyecto_id },
      select: { estado: true },
    })
    const total = todasTareas.length
    const completadas = todasTareas.filter((t) => t.estado === 'completada').length
    const avance = total > 0 ? Math.round((completadas / total) * 100) : 0
    await prisma.proyecto.update({ where: { id: proyecto_id }, data: { avance_general: avance } })

    return NextResponse.json(tarea, { status: 201 })
  } catch (err) {
    console.error('[POST /api/proyectos/[id]/tareas]', err)
    return NextResponse.json({ error: 'Error al crear tarea' }, { status: 500 })
  }
}
