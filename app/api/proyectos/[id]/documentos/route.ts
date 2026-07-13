import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/session'
import { supabaseAdmin, BUCKET } from '@/app/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  console.log('[POST documentos] handler iniciado')
  try {
    const { id: proyecto_id } = await params
    console.log('[POST documentos] proyecto_id:', proyecto_id)

    // Verificar sesión
    const token = req.cookies.get('token')?.value
    console.log('[POST documentos] token presente:', !!token)
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const session = await verifyToken(token)
    console.log('[POST documentos] sesión válida:', !!session, '— usuario:', session?.id)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyecto.findUnique({ where: { id: proyecto_id } })
    console.log('[POST documentos] proyecto encontrado:', !!proyecto)
    if (!proyecto) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    console.log('[POST documentos] leyendo formData...')
    const formData = await req.formData()
    const archivo = formData.get('archivo') as File | null
    const nombre = formData.get('nombre') as string
    const tipo = formData.get('tipo') as string
    const version = formData.get('version') as string
    const es_interno = formData.get('es_interno') === 'true'
    const estadoRaw = formData.get('estado') as string | null

    console.log('[POST documentos] campos recibidos:', {
      archivo: archivo ? `${archivo.name} (${archivo.size} bytes, ${archivo.type})` : null,
      nombre,
      tipo,
      version,
      es_interno,
    })

    if (!archivo || !nombre || !tipo || !version) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
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
    console.log('[POST documentos] ruta en storage:', storagePath)

    // Subir a Supabase Storage
    console.log('[POST documentos] convirtiendo archivo a ArrayBuffer...')
    const buffer = await archivo.arrayBuffer()
    console.log('[POST documentos] subiendo a Supabase Storage...')
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: archivo.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[POST documentos] upload error completo:', JSON.stringify(uploadError, null, 2))
      return NextResponse.json(
        { error: `Error al subir el archivo: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('[POST documentos] archivo subido correctamente')

    // Obtener URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)
    console.log('[POST documentos] URL pública:', urlData.publicUrl)

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
        url: urlData.publicUrl,
        subido_por: session.id,
        fase_subida: proyecto.fase,
      },
    })
    console.log('[POST documentos] documento guardado en BD, id:', documento.id)

    return NextResponse.json(documento, { status: 201 })
  } catch (err) {
    console.error('[POST documentos] ERROR no manejado:')
    console.error(err)
    if (err instanceof Error) {
      console.error('[POST documentos] mensaje:', err.message)
      console.error('[POST documentos] stack:', err.stack)
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno desconocido' },
      { status: 500 }
    )
  }
}
