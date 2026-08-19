import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/session'
import { supabaseAdmin, BUCKET } from '@/app/lib/supabase'
import { isAllowedExtension } from '@/app/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { filename, proyectoId, fileSize } = await req.json()
    if (!filename || !proyectoId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
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

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)

    if (error || !data) {
      console.error('[presign] error al generar URL:', error)
      return NextResponse.json({ error: 'Error al generar URL de subida' }, { status: 500 })
    }

    return NextResponse.json({ signedUrl: data.signedUrl, path })
  } catch (err) {
    console.error('[POST /api/documentos/presign]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
