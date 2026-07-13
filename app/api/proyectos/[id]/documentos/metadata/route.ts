import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/session'
import { supabaseAdmin, BUCKET } from '@/app/lib/supabase'

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
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id: proyecto_id } = await params
    const { path, nombre, tipo, version, es_interno, estado } = await req.json()

    if (!path || !nombre || !tipo || !version) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const proyecto = await prisma.proyecto.findUnique({ where: { id: proyecto_id } })
    if (!proyecto) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

    const esInterno = !!es_interno
    const estadoDefault = esInterno ? 'borrador' : 'pendiente_revision'
    const estadoFinal: EstadoDoc = ESTADOS_VALIDOS.includes(estado) ? estado : estadoDefault

    const documento = await prisma.documento.create({
      data: {
        proyecto_id,
        nombre,
        tipo,
        version,
        es_interno: esInterno,
        estado: estadoFinal,
        url: urlData.publicUrl,
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
