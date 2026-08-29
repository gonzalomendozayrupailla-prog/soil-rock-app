import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getSupabaseAdmin, BUCKET } from "@/app/lib/supabase"
import { requireAuth, requirePermiso, isAllowedExtension } from '@/app/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error

    const permError = requirePermiso(session, 'subir_documentos')
    if (permError) return permError

    const { filename, proyectoId, fileSize } = await req.json()
    if (!filename || !proyectoId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const proyectoExiste = await prisma.proyecto.findUnique({ where: { id: proyectoId }, select: { id: true } })
    if (!proyectoExiste) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    const MAX_SIZE = 50 * 1024 * 1024 // 50 MB
    if (typeof fileSize === 'number' && fileSize > MAX_SIZE) {
      return NextResponse.json(
        { error: 'El archivo supera el límite de 50 MB.' },
        { status: 413 }
      )
    }

    if (!isAllowedExtension(filename)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Use PDF, DOC, DOCX, XLS, XLSX, JPG, PNG o DWG.' },
        { status: 400 }
      )
    }

    const ext = filename.split('.').pop() ?? ''
    const safeName = filename
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .slice(0, 80)
    const path = `${proyectoId}/${Date.now()}-${safeName}.${ext}`

    const { data, error: uploadError } = await getSupabaseAdmin().storage
      .from(BUCKET)
      .createSignedUploadUrl(path)

    if (uploadError || !data) {
      console.error('[presign] error al generar URL:', uploadError)
      return NextResponse.json({ error: 'Error al generar URL de subida' }, { status: 500 })
    }

    return NextResponse.json({ signedUrl: data.signedUrl, path })
  } catch (err) {
    console.error('[POST /api/documentos/presign]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
