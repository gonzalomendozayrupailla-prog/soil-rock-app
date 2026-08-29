import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth, requirePermiso } from '@/app/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { id } = await params
  const reportes = await prisma.reporteCampo.findMany({
    where: { proyecto_id: id },
    include: {
      usuario: { select: { id: true, nombre: true } },
      personal: true,
      equipos: true,
    },
    orderBy: { fecha: 'desc' },
  })
  return NextResponse.json(reportes)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error

    const permError = requirePermiso(session, 'editar_reportes_campo')
    if (permError) return permError

    const { id: proyecto_id } = await params
    const body = await req.json()

    if (!body.fecha || !body.descripcion?.trim() || !body.clima) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const usuario_id = session.id

    const reporte = await prisma.reporteCampo.create({
      data: {
        proyecto_id,
        usuario_id,
        fecha: new Date(body.fecha),
        descripcion: body.descripcion.trim(),
        clima: body.clima,
        incidente: body.incidente ?? false,
        desc_incidente: body.desc_incidente?.trim() || null,
        personal: {
          create: (body.personal ?? []).map((p: { nombre: string; rol: string; horas: number }) => ({
            nombre: p.nombre,
            rol: p.rol,
            horas: p.horas,
          })),
        },
        equipos: {
          create: (body.equipos ?? []).map((e: { tipo: string; horas: number }) => ({
            tipo: e.tipo,
            horas: e.horas,
          })),
        },
      },
      include: {
        usuario: { select: { id: true, nombre: true } },
        personal: true,
        equipos: true,
      },
    })

    return NextResponse.json(reporte, { status: 201 })
  } catch (err) {
    console.error('[POST /api/proyectos/[id]/campo]', err)
    return NextResponse.json({ error: 'Error al crear reporte' }, { status: 500 })
  }
}
