import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const valorizaciones = await prisma.valorizacion.findMany({
    where: { proyecto_id: id },
    include: { partidas: { orderBy: { letra: 'asc' } } },
    orderBy: { numero: 'asc' },
  })
  return NextResponse.json(valorizaciones)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proyecto_id } = await params
    const body = await req.json()

    if (!body.periodo_inicio || !body.periodo_fin) {
      return NextResponse.json({ error: 'Periodo requerido' }, { status: 400 })
    }

    const ultimo = await prisma.valorizacion.findFirst({
      where: { proyecto_id },
      orderBy: { numero: 'desc' },
    })
    const numero = (ultimo?.numero ?? 0) + 1

    const partidas = (body.partidas ?? []) as Array<{
      letra: string; descripcion: string; unidad: string
      metrado: number; precio_unitario: number; avance_pct: number
    }>

    const monto_total = partidas.reduce((sum, p) => {
      return sum + Number(p.metrado) * Number(p.precio_unitario) * (Number(p.avance_pct) / 100)
    }, 0)

    const valorizacion = await prisma.valorizacion.create({
      data: {
        proyecto_id,
        numero,
        periodo_inicio: new Date(body.periodo_inicio),
        periodo_fin: new Date(body.periodo_fin),
        monto_total,
        partidas: {
          create: partidas.map((p) => ({
            letra: p.letra,
            descripcion: p.descripcion,
            unidad: p.unidad,
            metrado: p.metrado,
            precio_unitario: p.precio_unitario,
            avance_pct: p.avance_pct,
            monto: Number(p.metrado) * Number(p.precio_unitario) * (Number(p.avance_pct) / 100),
          })),
        },
      },
      include: { partidas: { orderBy: { letra: 'asc' } } },
    })

    return NextResponse.json(valorizacion, { status: 201 })
  } catch (err) {
    console.error('[POST valorizacion]', err)
    return NextResponse.json({ error: 'Error al crear valorizacion' }, { status: 500 })
  }
}
