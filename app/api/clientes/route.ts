import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const clientes = await prisma.cliente.findMany({
    include: {
      _count: { select: { contactos: true } },
    },
    orderBy: { razon_social: 'asc' },
  })
  return NextResponse.json(clientes)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const cliente = await prisma.cliente.create({
      data: {
        razon_social: body.razon_social,
        ruc: body.ruc,
        sector: body.sector,
        direccion: body.direccion,
      },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (err) {
    console.error('[POST /api/clientes]', err)
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }
}
