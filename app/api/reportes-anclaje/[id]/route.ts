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
  const reporte = await prisma.reporteAnclaje.findUnique({ where: { id } })
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

    const reporte = await prisma.reporteAnclaje.update({
      where: { id },
      data: {
        ...(body.codigo !== undefined   && { codigo: body.codigo.trim() }),
        ...(body.version !== undefined  && { version: body.version.trim() }),
        ...(body.fecha !== undefined    && { fecha: new Date(body.fecha) }),
        ...(body.ubicacion !== undefined      && { ubicacion: body.ubicacion.trim() }),
        ...(body.metodologia !== undefined    && { metodologia: body.metodologia.trim() }),
        ...(body.sistema !== undefined        && { sistema: body.sistema.trim() }),
        ...(body.martillo_dth !== undefined   && { martillo_dth: body.martillo_dth.trim() }),
        ...(body.diametro_casing !== undefined && { diametro_casing: body.diametro_casing.trim() }),
        ...(body.descripcion_suelo !== undefined && { descripcion_suelo: body.descripcion_suelo?.trim() || null }),
        ...(body.observaciones !== undefined     && { observaciones: body.observaciones?.trim() || null }),
        ...(body.perforadora_hidraulica !== undefined && { perforadora_hidraulica: body.perforadora_hidraulica?.trim() || null }),
        ...(body.compresora_aire !== undefined        && { compresora_aire: body.compresora_aire?.trim() || null }),
        ...(body.supervisor !== undefined             && { supervisor: body.supervisor?.trim() || null }),
        ...(body.oper_perforista !== undefined        && { oper_perforista: body.oper_perforista?.trim() || null }),
        ...(body.oper_compresorista !== undefined     && { oper_compresorista: body.oper_compresorista?.trim() || null }),
        ...(body.oficial_1 !== undefined  && { oficial_1: body.oficial_1?.trim() || null }),
        ...(body.ayudante_1 !== undefined && { ayudante_1: body.ayudante_1?.trim() || null }),
        ...(body.ayudante_2 !== undefined && { ayudante_2: body.ayudante_2?.trim() || null }),
        ...(body.anclajes_perforados !== undefined && { anclajes_perforados: body.anclajes_perforados }),
        ...(body.anclajes_acumulados !== undefined && { anclajes_acumulados: body.anclajes_acumulados }),
        ...(body.anclajes !== undefined       && { anclajes: body.anclajes }),
        ...(body.logo_sr_path !== undefined   && { logo_sr_path: body.logo_sr_path }),
        ...(body.logo_cliente_path !== undefined && { logo_cliente_path: body.logo_cliente_path }),
        ...(body.supervisor_obra !== undefined && { supervisor_obra: body.supervisor_obra?.trim() || null }),
        ...(body.ingeniero_civil !== undefined && { ingeniero_civil: body.ingeniero_civil?.trim() || null }),
        ...(body.esquema_path !== undefined   && { esquema_path: body.esquema_path }),
      },
    })

    return NextResponse.json(reporte)
  } catch (err) {
    console.error('[PATCH /api/reportes-anclaje/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar reporte' }, { status: 500 })
  }
}
