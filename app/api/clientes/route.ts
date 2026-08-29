import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth, requirePermiso } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth(req)
  if (error) return error

  const permError = requirePermiso(session, 'ver_clientes')
  if (permError) return permError

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.cliente.findMany({
      include: {
        _count: { select: { contactos: true } },
      },
      orderBy: { razon_social: 'asc' },
      skip,
      take: limit,
    }),
    prisma.cliente.count(),
  ])

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  })
}

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth(req)
    if (error) return error

    const permError = requirePermiso(session, 'editar_proyectos')
    if (permError) return permError

    const body = await req.json()

    const cliente = await prisma.cliente.create({
      data: {
        razon_social: body.razon_social,
        ruc: body.ruc,
        sector: body.sector,
        direccion: body.direccion || null,
      },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (err) {
    console.error('[POST /api/clientes]', err)
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }
}
