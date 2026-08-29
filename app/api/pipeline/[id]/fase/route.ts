import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth, requirePermiso } from '@/app/lib/auth'

const FASES_VALIDAS = [
  'pre_proyecto', 'propuesta', 'negociacion', 'adjudicado',
  'en_pausa', 'ejecucion', 'cierre', 'cerrado', 'cancelado',
] as const

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error
    const permError = requirePermiso(session, 'ver_comercial')
    if (permError) return permError

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

    const verMontos = session.permisos['ver_montos'] !== false
    return NextResponse.json(verMontos ? proyecto : { ...proyecto, monto_contrato: null })
  } catch (err) {
    console.error('[PATCH /api/pipeline/[id]/fase]', err)
    return NextResponse.json({ error: 'Error al actualizar fase' }, { status: 500 })
  }
}
