import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const proyectos = await prisma.proyecto.findMany({
    include: {
      cliente: { select: { razon_social: true } },
      ingeniero: { select: { nombre: true } },
    },
    orderBy: { created_at: 'desc' },
  })
  return NextResponse.json(proyectos)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Generar código GEO-YYYY-NNN con correlativo global
    const todos = await prisma.proyecto.findMany({ select: { codigo: true } })
    const maxNum = todos.reduce((max, p) => {
      const parts = p.codigo.split('-')
      const num = parseInt(parts[2] ?? '0', 10)
      return Math.max(max, isNaN(num) ? 0 : num)
    }, 0)
    const year = new Date().getFullYear()
    const codigo = `GEO-${year}-${String(maxNum + 1).padStart(3, '0')}`

    const proyecto = await prisma.proyecto.create({
      data: {
        codigo,
        nombre: body.nombre,
        cliente_id: body.cliente_id,
        sector: body.sector,
        fase: body.fase,
        ingeniero_id: body.ingeniero_id,
        fecha_inicio: new Date(body.fecha_inicio),
        fecha_cierre_estimada: new Date(body.fecha_cierre_estimada),
        monto_contrato: body.monto_contrato,
        avance_general: body.avance_general ?? 0,
      },
    })

    return NextResponse.json(proyecto, { status: 201 })
  } catch (err) {
    console.error('[POST /api/proyectos]', err)
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 })
  }
}
