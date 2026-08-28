import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getSupabaseAdmin, BUCKET } from "@/app/lib/supabase"
import { requireAuth } from '@/app/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth(req)
    if (error) return error

    const { id } = await params

    const documento = await prisma.documento.findUnique({ where: { id } })
    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    // Extraer la ruta en Storage desde la URL pública
    const marker = `/storage/v1/object/public/${BUCKET}/`
    const storagePath = documento.url.split(marker)[1]
    if (storagePath) {
      await getSupabaseAdmin().storage.from(BUCKET).remove([storagePath])
    }

    await prisma.documento.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/documentos/[id]]', err)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth(req)
    if (error) return error

    const { id } = await params
    const body = await req.json()

    const documento = await prisma.documento.update({
      where: { id },
      data: {
        ...(body.nombre !== undefined && { nombre: body.nombre }),
        ...(body.tipo !== undefined && { tipo: body.tipo }),
        ...(body.version !== undefined && { version: body.version }),
        ...(body.estado !== undefined && { estado: body.estado }),
        ...(body.es_interno !== undefined && { es_interno: body.es_interno }),
      },
    })

    return NextResponse.json(documento)
  } catch (err) {
    console.error('[PUT /api/documentos/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}
