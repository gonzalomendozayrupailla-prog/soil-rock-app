import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tarea_id } = await params
    const { titulo } = await req.json()
    if (!titulo?.trim()) return NextResponse.json({ error: 'Titulo requerido' }, { status: 400 })

    const subtarea = await prisma.subtarea.create({
      data: { tarea_id, titulo: titulo.trim() },
    })
    return NextResponse.json(subtarea, { status: 201 })
  } catch (err) {
    console.error('[POST /api/tareas/[id]/subtareas]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
