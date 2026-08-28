import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'
import { getSupabaseAdmin, BUCKET } from "@/app/lib/supabase"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { id } = await params
  const tipo = req.nextUrl.searchParams.get('tipo') // 'sr' | 'cliente' | 'esquema'

  const reporte = await prisma.reporteInyeccion.findUnique({
    where: { id },
    select: { logo_sr_path: true, logo_cliente_path: true, esquema_path: true },
  })

  if (!reporte) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const path = tipo === 'sr' ? reporte.logo_sr_path
    : tipo === 'esquema' ? reporte.esquema_path
    : reporte.logo_cliente_path
  if (!path) return NextResponse.json({ error: 'Sin imagen' }, { status: 404 })

  const { data, error: signError } = await getSupabaseAdmin().storage
    .from(BUCKET)
    .createSignedUrl(path, 300)

  if (signError || !data) {
    return NextResponse.json({ error: 'Error al generar URL' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
