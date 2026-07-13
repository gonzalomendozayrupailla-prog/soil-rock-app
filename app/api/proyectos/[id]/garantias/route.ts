import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const garantias = await prisma.garantia.findMany({
    where: { proyecto_id: id },
    orderBy: { fecha_vencimiento: 'asc' },
  })
  return NextResponse.json(garantias)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proyecto_id } = await params
    const body = await req.json()

    if (!body.tipo || !body.monto || !body.fecha_vencimiento) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const garantia = await prisma.garantia.create({
      data: {
        proyecto_id,
        tipo: body.tipo,
        monto: Number(body.monto),
        porcentaje: Number(body.porcentaje ?? 0),
        fecha_vencimiento: new Date(body.fecha_vencimiento),
        documento_url: body.documento_url || null,
      },
    })

    return NextResponse.json(garantia, { status: 201 })
  } catch (err) {
    console.error('[POST garantia]', err)
    return NextResponse.json({ error: 'Error al crear garantia' }, { status: 500 })
  }
}
