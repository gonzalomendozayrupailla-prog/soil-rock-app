import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      contactos: { orderBy: { nombre: 'asc' } },
    },
  })

  if (!cliente) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  return NextResponse.json(cliente)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        razon_social: body.razon_social,
        ruc: body.ruc,
        sector: body.sector,
        direccion: body.direccion,
      },
    })

    return NextResponse.json(cliente)
  } catch (err) {
    console.error('[PUT /api/clientes/[id]]', err)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}
