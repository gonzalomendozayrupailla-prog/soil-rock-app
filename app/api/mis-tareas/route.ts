import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error

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
