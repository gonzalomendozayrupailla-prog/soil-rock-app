import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/session'

const FASES_VALIDAS = [
  'pre_proyecto', 'propuesta', 'negociacion', 'adjudicado',
  'en_pausa', 'ejecucion', 'cierre', 'cerrado', 'cancelado',
] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const { fase, monto_contrato } = await req.json()

    if (!FASES_VALIDAS.includes(fase)) {
      return NextResponse.json({ error: 'Fase inválida' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { fase }
    if (fase === 'ejecucion' && monto_contrato !== undefined) {
      updateData.monto_contrato = monto_contrato
    }

    const proyecto = await prisma.proyecto.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(proyecto)
  } catch (err) {
    console.error('[PATCH /api/pipeline/[id]/fase]', err)
    return NextResponse.json({ error: 'Error al actualizar fase' }, { status: 500 })
  }
}
