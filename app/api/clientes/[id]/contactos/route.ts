import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth(req)
    if (error) return error

    const { id } = await params
    const body = await req.json()

    const cliente = await prisma.cliente.findUnique({ where: { id } })
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const contacto = await prisma.contactoCliente.create({
      data: {
        cliente_id: id,
        nombre: body.nombre,
        cargo: body.cargo,
        email: body.email,
        telefono: body.telefono,
      },
    })

    return NextResponse.json(contacto, { status: 201 })
  } catch (err) {
    console.error('[POST /api/clientes/[id]/contactos]', err)
    return NextResponse.json({ error: 'Error al agregar contacto' }, { status: 500 })
  }
}
