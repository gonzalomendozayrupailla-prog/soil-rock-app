import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth(req)
    if (error) return error

    const { id } = await params

    const carpeta = await prisma.carpetaDocumento.findUnique({
      where: { id },
      include: { documentos: { select: { id: true } } },
    })

    if (!carpeta) {
      return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 })
    }

    if (carpeta.documentos.length > 0) {
      return NextResponse.json(
        { error: 'La carpeta tiene documentos. Elimínalos primero.' },
        { status: 400 }
      )
    }

    await prisma.carpetaDocumento.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/carpetas/[id]]', err)
    return NextResponse.json({ error: 'Error al eliminar carpeta' }, { status: 500 })
  }
}
