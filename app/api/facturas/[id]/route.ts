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
    if (body.metodo_pago !== undefined)       data.metodo_pago = body.metodo_pago
    if (body.fecha_vencimiento !== undefined) data.fecha_vencimiento = new Date(body.fecha_vencimiento)

    const factura = await prisma.factura.update({
      where: { id },
      data,
      include: { valorizacion: { select: { id: true, numero: true } } },
    })
    return NextResponse.json(factura)
  } catch (err) {
    console.error('[PATCH factura]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
