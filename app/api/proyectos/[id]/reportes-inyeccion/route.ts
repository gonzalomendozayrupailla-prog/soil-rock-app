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
  const reportes = await prisma.reporteInyeccion.findMany({
    where: { proyecto_id: id },
    select: {
      id: true,
      codigo: true,
      version: true,
      fecha: true,
      anclajes: true,
      created_at: true,
    },
    orderBy: { created_at: 'desc' },
  })
  return NextResponse.json(reportes)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  try {
    const { id: proyecto_id } = await params
    const body = await req.json()

    if (!body.codigo?.trim() || !body.fecha) {
      return NextResponse.json({ error: 'Código y fecha son requeridos' }, { status: 400 })
    }

    const reporte = await prisma.reporteInyeccion.create({
      data: {
        proyecto_id,
        codigo: body.codigo.trim(),
        version: body.version?.trim() ?? '001',
        fecha: new Date(body.fecha),
        ubicacion: body.ubicacion?.trim() ?? '',
        metodologia: body.metodologia?.trim() ?? '',
        fluido: body.fluido?.trim() ?? '',
        cemento: body.cemento?.trim() ?? '',
        aditivo: body.aditivo?.trim() ?? '',
        descripcion_suelo: body.descripcion_suelo?.trim() || null,
        observaciones: body.observaciones?.trim() || null,
        central_inyeccion: body.central_inyeccion?.trim() || null,
        supervisor: body.supervisor?.trim() || null,
        oper_perforista: body.oper_perforista?.trim() || null,
        oper_inyeccion: body.oper_inyeccion?.trim() || null,
        anclajes_inyectados: body.anclajes_inyectados ?? 0,
        anclajes_acumulados: body.anclajes_acumulados ?? 0,
        anclajes: body.anclajes ?? [],
        logo_sr_path: body.logo_sr_path ?? null,
        logo_cliente_path: body.logo_cliente_path ?? null,
        supervisor_sr: body.supervisor_sr?.trim() || null,
        supervisor_cliente: body.supervisor_cliente?.trim() || null,
        esquema_path: body.esquema_path ?? null,
      },
    })

    return NextResponse.json(reporte, { status: 201 })
  } catch (err) {
    console.error('[POST /api/proyectos/[id]/reportes-inyeccion]', err)
    return NextResponse.json({ error: 'Error al crear reporte' }, { status: 500 })
  }
}
