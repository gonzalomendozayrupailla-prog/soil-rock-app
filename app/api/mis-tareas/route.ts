import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/session'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const tareas = await prisma.tarea.findMany({
      where: { asignado_a: session.id },
      include: {
        proyecto: { select: { id: true, nombre: true, codigo: true } },
        creador: { select: { id: true, nombre: true } },
        subtareas: true,
      },
      orderBy: [{ fecha_limite: 'asc' }, { prioridad: 'desc' }, { created_at: 'desc' }],
    })
    return NextResponse.json(tareas)
  } catch (err) {
    console.error('[GET /api/mis-tareas]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
