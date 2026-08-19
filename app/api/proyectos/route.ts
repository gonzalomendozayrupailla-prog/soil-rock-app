import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth, requirePermiso } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth(req)
  if (error) return error

  const permError = requirePermiso(session, 'ver_proyectos')
  if (permError) return permError

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.proyecto.findMany({
      include: {
        cliente: { select: { razon_social: true } },
        ingeniero: { select: { nombre: true } },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.proyecto.count(),
  ])

  const verMontos = session.permisos['ver_montos'] !== false
  const dataFiltrada = verMontos
    ? data
    : data.map((p) => ({ ...p, monto_contrato: null }))

  return NextResponse.json({
    data: dataFiltrada,
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

    // Generar código SR{YY}.{NNN} con correlativo global
    const todos = await prisma.proyecto.findMany({ select: { codigo: true } })
    const maxNum = todos.reduce((max, p) => {
      const parts = p.codigo.split('.')
      const num = parseInt(parts[1] ?? '0', 10)
      return Math.max(max, isNaN(num) ? 0 : num)
    }, 0)
    const year2 = String(new Date().getFullYear()).slice(-2)
    const codigo = `SR${year2}.${String(maxNum + 1).padStart(3, '0')}`

    const proyecto = await prisma.proyecto.create({
      data: {
        codigo,
        nombre: body.nombre,
        cliente_id: body.cliente_id,
        sector: body.sector,
        fase: body.fase,
        moneda: body.moneda ?? 'PEN',
        ingeniero_id: body.ingeniero_id,
        fecha_inicio: new Date(body.fecha_inicio),
        fecha_cierre_estimada: new Date(body.fecha_cierre_estimada),
        monto_contrato: body.monto_contrato,
        avance_general: body.avance_general ?? 0,
      },
    })

    return NextResponse.json(proyecto, { status: 201 })
  } catch (err) {
    console.error('[POST /api/proyectos]', err)
    return NextResponse.json({ error: 'Error al crear proyecto' }, { status: 500 })
  }
}
