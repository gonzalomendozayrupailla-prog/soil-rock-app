import Link from 'next/link'
import { prisma } from '@/app/lib/prisma'
import { NuevoProyectoForm } from './form'

async function getCodigoPreview() {
  const todos = await prisma.proyecto.findMany({ select: { codigo: true } })
  const maxNum = todos.reduce((max, p) => {
    const parts = p.codigo.split('-')
    const num = parseInt(parts[2] ?? '0', 10)
    return Math.max(max, isNaN(num) ? 0 : num)
  }, 0)
  const year = new Date().getFullYear()
  return `GEO-${year}-${String(maxNum + 1).padStart(3, '0')}`
}

export default async function NuevoProyectoPage() {
  const [clientes, usuarios, codigoPreview] = await Promise.all([
    prisma.cliente.findMany({
      select: { id: true, razon_social: true },
      orderBy: { razon_social: 'asc' },
    }),
    prisma.usuario.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, rol: true },
      orderBy: { nombre: 'asc' },
    }),
    getCodigoPreview(),
  ])

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/proyectos"
          className="mb-2 inline-block text-sm text-zinc-500 hover:text-zinc-900"
        >
          &larr; Volver a proyectos
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Nuevo proyecto</h1>
      </div>

      <div className="max-w-2xl rounded-xl border border-zinc-200 bg-white p-6">
        <NuevoProyectoForm
          clientes={clientes}
          usuarios={usuarios}
          codigoPreview={codigoPreview}
        />
      </div>
    </div>
  )
}
