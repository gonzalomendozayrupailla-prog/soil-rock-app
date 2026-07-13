import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (body.estado !== undefined)         data.estado = body.estado
    if (body.periodo_inicio !== undefined) data.periodo_inicio = new Date(body.periodo_inicio)
    if (body.periodo_fin !== undefined)    data.periodo_fin = new Date(body.periodo_fin)

    const valorizacion = await prisma.valorizacion.update({
      where: { id },
      data,
      include: { partidas: { orderBy: { letra: 'asc' } } },
    })
    return NextResponse.json(valorizacion)
  } catch (err) {
    console.error('[PATCH valorizacion]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.valorizacion.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE valorizacion]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
