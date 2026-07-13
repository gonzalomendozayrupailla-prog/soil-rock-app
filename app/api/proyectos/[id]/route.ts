import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    include: {
      cliente: {
        include: { contactos: { where: { activo: true }, orderBy: { nombre: 'asc' } } },
      },
      ingeniero: { select: { id: true, nombre: true, correo: true, rol: true } },
    },
  })
  if (!proyecto) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }
  return NextResponse.json(proyecto)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (body.nombre !== undefined)                data.nombre = body.nombre
    if (body.sector !== undefined)                data.sector = body.sector
    if (body.monto_contrato !== undefined)        data.monto_contrato = body.monto_contrato
    if (body.fase !== undefined)                  data.fase = body.fase
    if (body.avance_general !== undefined)        data.avance_general = Number(body.avance_general)
    if (body.fecha_inicio !== undefined)          data.fecha_inicio = new Date(body.fecha_inicio)
    if (body.fecha_cierre_estimada !== undefined) data.fecha_cierre_estimada = new Date(body.fecha_cierre_estimada)

    const proyecto = await prisma.proyecto.update({ where: { id }, data })
    return NextResponse.json(proyecto)
  } catch (err) {
    console.error('[PATCH /api/proyectos/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const proyecto = await prisma.proyecto.update({
      where: { id },
      data: {
        nombre: body.nombre,
        cliente_id: body.cliente_id,
        sector: body.sector,
        fase: body.fase,
        ingeniero_id: body.ingeniero_id,
        fecha_inicio: new Date(body.fecha_inicio),
        fecha_cierre_estimada: new Date(body.fecha_cierre_estimada),
        monto_contrato: body.monto_contrato,
        avance_general: body.avance_general,
      },
    })
    return NextResponse.json(proyecto)
  } catch (err) {
    console.error('[PUT /api/proyectos/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}
