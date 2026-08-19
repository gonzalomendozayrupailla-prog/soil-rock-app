import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subtareaId: string }> }
) {
  try {
    const { error } = await requireAuth(req)
    if (error) return error

    const { subtareaId } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.titulo !== undefined)     data.titulo = body.titulo
    if (body.completada !== undefined) data.completada = body.completada

    const subtarea = await prisma.subtarea.update({ where: { id: subtareaId }, data })
    return NextResponse.json(subtarea)
  } catch (err) {
    console.error('[PATCH subtarea]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subtareaId: string }> }
) {
  try {
    const { error } = await requireAuth(req)
    if (error) return error

    const { subtareaId } = await params
    await prisma.subtarea.delete({ where: { id: subtareaId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE subtarea]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
