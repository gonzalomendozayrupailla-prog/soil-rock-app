import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { id } = await params
  const reporte = await prisma.reporteInyeccion.findUnique({ where: { id } })
  if (!reporte) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(reporte)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  try {
    const { id } = await params
    const body = await req.json()

    const reporte = await prisma.reporteInyeccion.update({
      where: { id },
      data: {
        ...(body.codigo !== undefined     && { codigo: body.codigo.trim() }),
        ...(body.version !== undefined    && { version: body.version.trim() }),
        ...(body.fecha !== undefined      && { fecha: new Date(body.fecha) }),
        ...(body.ubicacion !== undefined  && { ubicacion: body.ubicacion.trim() }),
        ...(body.metodologia !== undefined && { metodologia: body.metodologia.trim() }),
        ...(body.fluido !== undefined     && { fluido: body.fluido.trim() }),
        ...(body.cemento !== undefined    && { cemento: body.cemento.trim() }),
        ...(body.aditivo !== undefined    && { aditivo: body.aditivo.trim() }),
        ...(body.descripcion_suelo !== undefined && { descripcion_suelo: body.descripcion_suelo?.trim() || null }),
        ...(body.observaciones !== undefined     && { observaciones: body.observaciones?.trim() || null }),
        ...(body.central_inyeccion !== undefined && { central_inyeccion: body.central_inyeccion?.trim() || null }),
        ...(body.supervisor !== undefined        && { supervisor: body.supervisor?.trim() || null }),
        ...(body.oper_perforista !== undefined   && { oper_perforista: body.oper_perforista?.trim() || null }),
        ...(body.oper_inyeccion !== undefined    && { oper_inyeccion: body.oper_inyeccion?.trim() || null }),
        ...(body.anclajes_inyectados !== undefined && { anclajes_inyectados: body.anclajes_inyectados }),
        ...(body.anclajes_acumulados !== undefined && { anclajes_acumulados: body.anclajes_acumulados }),
        ...(body.anclajes !== undefined           && { anclajes: body.anclajes }),
        ...(body.logo_sr_path !== undefined       && { logo_sr_path: body.logo_sr_path }),
        ...(body.logo_cliente_path !== undefined  && { logo_cliente_path: body.logo_cliente_path }),
        ...(body.supervisor_sr !== undefined      && { supervisor_sr: body.supervisor_sr?.trim() || null }),
        ...(body.supervisor_cliente !== undefined && { supervisor_cliente: body.supervisor_cliente?.trim() || null }),
        ...(body.esquema_path !== undefined       && { esquema_path: body.esquema_path }),
      },
    })

    return NextResponse.json(reporte)
  } catch (err) {
    console.error('[PATCH /api/reportes-inyeccion/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar reporte' }, { status: 500 })
  }
}
