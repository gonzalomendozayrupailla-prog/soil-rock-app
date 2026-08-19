import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'
import { supabaseAdmin, BUCKET } from '@/app/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { id } = await params

  const documento = await prisma.documento.findUnique({
    where: { id },
    select: { url: true },
  })

  if (!documento) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  }

  const { data, error: signError } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(documento.url, 3600)

  if (signError || !data) {
    console.error('[download] error generando signed URL:', signError?.message)
    return NextResponse.json({ error: 'Error al generar enlace de descarga' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
