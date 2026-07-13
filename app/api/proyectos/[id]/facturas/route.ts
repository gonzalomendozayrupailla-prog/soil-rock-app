import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const facturas = await prisma.factura.findMany({
    where: { proyecto_id: id },
    include: {
      valorizacion: { select: { id: true, numero: true } },
    },
    orderBy: { fecha_emision: 'desc' },
  })
  return NextResponse.json(facturas)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proyecto_id } = await params
    const body = await req.json()

    if (!body.numero || !body.monto || !body.fecha_emision || !body.fecha_vencimiento) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const retencion_pct = Number(body.retencion_pct ?? 0)
    const monto = Number(body.monto)
    const monto_neto = monto - monto * (retencion_pct / 100)

    const factura = await prisma.factura.create({
      data: {
        proyecto_id,
        valorizacion_id: body.valorizacion_id || null,
        numero: body.numero,
        monto,
        fecha_emision: new Date(body.fecha_emision),
        fecha_vencimiento: new Date(body.fecha_vencimiento),
        retencion_pct,
        monto_neto,
        metodo_pago: body.metodo_pago || null,
      },
      include: { valorizacion: { select: { id: true, numero: true } } },
    })

    return NextResponse.json(factura, { status: 201 })
  } catch (err) {
    console.error('[POST factura]', err)
    return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 })
  }
}
