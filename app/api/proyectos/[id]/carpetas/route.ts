import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { id: proyecto_id } = await params
  const modulo = req.nextUrl.searchParams.get('modulo') ?? 'documentos'

  const carpetas = await prisma.carpetaDocumento.findMany({
    where: { proyecto_id, modulo },
    include: {
      documentos: {
        include: { subido: { select: { nombre: true } } },
        orderBy: { fecha_subida: 'desc' },
      },
    },
    orderBy: { created_at: 'asc' },
  })

  return NextResponse.json(carpetas)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth(req)
    if (error) return error

    const { id: proyecto_id } = await params
    const { nombre, modulo = 'documentos' } = await req.json()

    if (!nombre?.trim()) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }

    const carpeta = await prisma.carpetaDocumento.create({
      data: { proyecto_id, nombre: nombre.trim(), modulo },
      include: { documentos: true },
    })

    return NextResponse.json(carpeta, { status: 201 })
  } catch (err) {
    console.error('[POST /api/proyectos/[id]/carpetas]', err)
    return NextResponse.json({ error: 'Error al crear carpeta' }, { status: 500 })
  }
}
