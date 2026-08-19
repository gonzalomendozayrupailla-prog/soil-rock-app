import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/session'
import { supabaseAdmin, BUCKET } from '@/app/lib/supabase'
import { requireAuth, isAllowedExtension } from '@/app/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { id } = await params

  const documentos = await prisma.documento.findMany({
    where: { proyecto_id: id },
    include: {
      subido: { select: { nombre: true } },
    },
    orderBy: { fecha_subida: 'desc' },
  })

  return NextResponse.json(documentos)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proyecto_id } = await params

    // Verificar sesión
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyecto.findUnique({ where: { id: proyecto_id } })
    if (!proyecto) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    const formData = await req.formData()
    const archivo = formData.get('archivo') as File | null
    const nombre = formData.get('nombre') as string
    const tipo = formData.get('tipo') as string
    const version = formData.get('version') as string
    const es_interno = formData.get('es_interno') === 'true'
    const estadoRaw = formData.get('estado') as string | null

    if (!archivo || !nombre || !tipo || !version) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    if (!isAllowedExtension(archivo.name)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Use PDF, DOC, DOCX, XLS, XLSX, JPG, PNG o DWG.' },
        { status: 400 }
      )
    }

    if (archivo.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo supera el límite de 50MB' }, { status: 400 })
    }

    // Nombre de archivo único: timestamp + nombre saneado
    const ext = archivo.name.split('.').pop() ?? ''
    const safeName = archivo.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .slice(0, 80)
    const filename = `${Date.now()}-${safeName}.${ext}`
    const storagePath = `${proyecto_id}/${filename}`

    // Subir a Supabase Storage
    const buffer = await archivo.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: archivo.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[POST documentos] upload error:', uploadError.message)
      return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
    }

    // Determinar estado inicial
    const ESTADOS_VALIDOS = ['borrador', 'enviado_cliente', 'con_observaciones', 'aprobado', 'pendiente_revision', 'revisado']
    const estadoDefault = es_interno ? 'borrador' : 'pendiente_revision'
    const estado = (estadoRaw && ESTADOS_VALIDOS.includes(estadoRaw)) ? estadoRaw : estadoDefault

    // Guardar en BD
    const documento = await prisma.documento.create({
      data: {
        proyecto_id,
        nombre,
        tipo,
        version,
        es_interno,
        estado: estado as 'borrador' | 'enviado_cliente' | 'con_observaciones' | 'aprobado' | 'pendiente_revision' | 'revisado',
        url: storagePath,
        subido_por: session.id,
        fase_subida: proyecto.fase,
      },
    })

    return NextResponse.json(documento, { status: 201 })
  } catch (err) {
    console.error('[POST documentos] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
