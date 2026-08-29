import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth, requirePermiso } from '@/app/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(req)
  if (error) return error

  const permError = requirePermiso(session, 'ver_proyectos')
  if (permError) return permError

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

  const verMontos = session.permisos['ver_montos'] !== false
  return NextResponse.json(verMontos ? proyecto : { ...proyecto, monto_contrato: null })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error

    const permError = requirePermiso(session, 'editar_proyectos')
    if (permError) return permError

    const { id } = await params
    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (body.nombre !== undefined)                data.nombre = body.nombre
    if (body.sector !== undefined)                data.sector = body.sector
    if (body.moneda !== undefined)                data.moneda = body.moneda
    if (body.monto_contrato !== undefined)        data.monto_contrato = body.monto_contrato
    if (body.fase !== undefined)                  data.fase = body.fase
    if (body.avance_general !== undefined)        data.avance_general = Number(body.avance_general)
    if (body.fecha_inicio !== undefined)          data.fecha_inicio = new Date(body.fecha_inicio)
    if (body.fecha_cierre_estimada !== undefined) data.fecha_cierre_estimada = new Date(body.fecha_cierre_estimada)
    if (body.ubicacion !== undefined)             data.ubicacion = body.ubicacion || null
    if (body.cliente_id !== undefined)            data.cliente_id = body.cliente_id

    const proyecto = await prisma.proyecto.update({ where: { id }, data })
    const verMontos = session.permisos['ver_montos'] !== false
    return NextResponse.json(verMontos ? proyecto : { ...proyecto, monto_contrato: null })
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
    const { session, error } = await requireAuth(req)
    if (error) return error

    const permError = requirePermiso(session, 'editar_proyectos')
    if (permError) return permError

    const { id } = await params
    const body = await req.json()

    const proyecto = await prisma.proyecto.update({
      where: { id },
      data: {
        nombre: body.nombre,
        cliente_id: body.cliente_id,
        sector: body.sector,
        fase: body.fase,
        moneda: body.moneda,
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
