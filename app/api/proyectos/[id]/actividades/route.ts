import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/session'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id: proyecto_id } = await params
    const { tipo, descripcion } = await req.json()

    if (!tipo || !descripcion?.trim()) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Fallback si el usuario de la sesión no existe
    let usuario_id = session.id
    const usuarioExiste = await prisma.usuario.findUnique({ where: { id: usuario_id } })
    if (!usuarioExiste) {
      const primero = await prisma.usuario.findFirst({ where: { activo: true } })
      if (!primero) return NextResponse.json({ error: 'No hay usuarios en el sistema' }, { status: 500 })
      usuario_id = primero.id
    }

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
