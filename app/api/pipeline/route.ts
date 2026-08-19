import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/session'
import { requireAuth } from '@/app/lib/auth'

const FASES_PIPELINE = ['pre_proyecto', 'propuesta', 'negociacion', 'adjudicado', 'en_pausa'] as const

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)))
  const skip = (page - 1) * limit

  const where = { fase: { in: [...FASES_PIPELINE] } }

  const [data, total] = await Promise.all([
    prisma.proyecto.findMany({
      where,
      include: { cliente: { select: { razon_social: true } } },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.proyecto.count({ where }),
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
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { nombre, cliente_id, sector, monto_contrato, fecha_inicio, moneda } = body

    if (!nombre || !cliente_id || !sector || !fecha_inicio) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Código correlativo SR{YY}.{NNN}
    const todos = await prisma.proyecto.findMany({ select: { codigo: true } })
    const maxNum = todos.reduce((max, p) => {
      const parts = p.codigo.split('.')
      const num = parseInt(parts[1] ?? '0', 10)
      return Math.max(max, isNaN(num) ? 0 : num)
    }, 0)
    const year2 = String(new Date().getFullYear()).slice(-2)
    const codigo = `SR${year2}.${String(maxNum + 1).padStart(3, '0')}`

    // ingeniero_id = usuario de sesión, con fallback al primer usuario activo
    let ingenieroId = session.id
    const usuarioSesion = await prisma.usuario.findUnique({ where: { id: ingenieroId } })
    if (!usuarioSesion) {
      const primero = await prisma.usuario.findFirst({ where: { activo: true } })
      if (!primero) return NextResponse.json({ error: 'No hay usuarios en el sistema' }, { status: 500 })
      ingenieroId = primero.id
    }

    const fechaInicio = new Date(fecha_inicio)
    const fechaCierre = new Date(fechaInicio)
    fechaCierre.setMonth(fechaCierre.getMonth() + 6)

    const proyecto = await prisma.proyecto.create({
      data: {
        codigo,
        nombre,
        cliente_id,
        sector,
        fase: 'pre_proyecto',
        moneda: moneda ?? 'PEN',
        ingeniero_id: ingenieroId,
        fecha_inicio: fechaInicio,
        fecha_cierre_estimada: fechaCierre,
        monto_contrato,
        avance_general: 0,
      },
    })

    return NextResponse.json(proyecto, { status: 201 })
  } catch (err) {
    console.error('[POST /api/pipeline]', err)
    return NextResponse.json({ error: 'Error al crear oportunidad' }, { status: 500 })
  }
}
