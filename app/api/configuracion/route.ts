import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  const config = await prisma.configuracionEmpresa.findFirst()
  return NextResponse.json(config)
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error
    if (session.rol !== 'gerente') {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    const body = await req.json()
    const data: { razon_social?: string; ruc?: string } = {}
    if (body.razon_social !== undefined) data.razon_social = String(body.razon_social).trim()
    if (body.ruc !== undefined)          data.ruc          = String(body.ruc).trim()

    const existing = await prisma.configuracionEmpresa.findFirst()

    let config
    if (existing) {
      config = await prisma.configuracionEmpresa.update({
        where: { id: existing.id },
        data,
      })
    } else {
      config = await prisma.configuracionEmpresa.create({
        data: {
          razon_social: data.razon_social ?? 'Soil Rock S.A.C.',
          ruc:          data.ruc          ?? '',
        },
      })
    }

    return NextResponse.json(config)
  } catch (err) {
    console.error('[PATCH /api/configuracion]', err)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
