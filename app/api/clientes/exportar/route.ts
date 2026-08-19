import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { requireAuth } from '@/app/lib/auth'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req)
  if (error) return error

  const clientes = await prisma.cliente.findMany({
    include: { contactos: true },
    orderBy: { razon_social: 'asc' },
  })

  // Hoja 1: Clientes
  const clientesRows = clientes.map((c) => ({
    'Razón Social': c.razon_social,
    RUC: c.ruc,
    Sector: c.sector,
    Dirección: c.direccion ?? '',
  }))

  // Hoja 2: Contactos
  const contactosRows = clientes.flatMap((c) =>
    c.contactos.map((ct) => ({
      'Razón Social (Cliente)': c.razon_social,
      'Nombre Contacto': ct.nombre,
      Cargo: ct.cargo,
      Email: ct.email,
      Teléfono: ct.telefono,
    }))
  )

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientesRows), 'Clientes')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(contactosRows), 'Contactos')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Clientes_SoilRock.xlsx"',
    },
  })
}
