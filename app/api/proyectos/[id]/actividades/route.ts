import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { id } = await params
  const actividades = await prisma.actividad.findMany({
    where: { proyecto_id: id },
    include: { usuario: { select: { nombre: true } } },
    orderBy: { created_at: 'asc' },
  })
  return NextResponse.json(actividades)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error

    const { id: proyecto_id } = await params
    const { tipo, descripcion } = await req.json()

    if (!tipo || !descripcion?.trim()) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const usuario_id = session.id

    const actividad = await prisma.actividad.create({
      data: { proyecto_id, usuario_id, tipo, descripcion },
      include: { usuario: { select: { nombre: true } } },
    })

    return NextResponse.json(actividad, { status: 201 })
  } catch (err) {
    console.error('[POST /api/proyectos/[id]/actividades]', err)
    return NextResponse.json({ error: 'Error al registrar actividad' }, { status: 500 })
  }
}
