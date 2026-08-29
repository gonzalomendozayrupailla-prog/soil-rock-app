import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth, requirePermiso } from '@/app/lib/auth'

const ESTADOS_VALIDOS = [
  'borrador', 'enviado_cliente', 'con_observaciones',
  'aprobado', 'pendiente_revision', 'revisado',
] as const

type EstadoDoc = typeof ESTADOS_VALIDOS[number]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error

    const permError = requirePermiso(session, 'subir_documentos')
    if (permError) return permError

    const { id: proyecto_id } = await params
    const { path, nombre, tipo, version, es_interno, estado, carpeta_id } = await req.json()

    if (!path || !nombre || !tipo || !version) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const proyecto = await prisma.proyecto.findUnique({ where: { id: proyecto_id } })
    if (!proyecto) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    const esInterno = !!es_interno
    const estadoDefault = esInterno ? 'borrador' : 'pendiente_revision'
    const estadoFinal: EstadoDoc = ESTADOS_VALIDOS.includes(estado) ? estado : estadoDefault

    const documento = await prisma.documento.create({
      data: {
        proyecto_id,
        carpeta_id: carpeta_id ?? null,
        nombre,
        tipo,
        version,
        es_interno: esInterno,
        estado: estadoFinal,
        url: path,
        subido_por: session.id,
        fase_subida: proyecto.fase,
      },
      include: { subido: { select: { nombre: true } } },
    })

    return NextResponse.json(documento, { status: 201 })
  } catch (err) {
    console.error('[POST /api/proyectos/[id]/documentos/metadata]', err)
    return NextResponse.json({ error: 'Error al guardar metadatos' }, { status: 500 })
  }
}
