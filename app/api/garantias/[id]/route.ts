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
    if (body.estado !== undefined)            data.estado = body.estado
    if (body.documento_url !== undefined)     data.documento_url = body.documento_url
    if (body.fecha_vencimiento !== undefined) data.fecha_vencimiento = new Date(body.fecha_vencimiento)

    const garantia = await prisma.garantia.update({ where: { id }, data })
    return NextResponse.json(garantia)
  } catch (err) {
    console.error('[PATCH garantia]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.garantia.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE garantia]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
