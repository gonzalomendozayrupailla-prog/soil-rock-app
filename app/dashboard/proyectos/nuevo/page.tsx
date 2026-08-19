import Link from 'next/link'
import { prisma } from '@/app/lib/prisma'
import { NuevoProyectoForm } from './form'

async function getCodigoPreview() {
  const todos = await prisma.proyecto.findMany({ select: { codigo: true } })
  const maxNum = todos.reduce((max, p) => {
    const parts = p.codigo.split('.')
    const num = parseInt(parts[1] ?? '0', 10)
    return Math.max(max, isNaN(num) ? 0 : num)
  }, 0)
  const year2 = String(new Date().getFullYear()).slice(-2)
  return `SR${year2}.${String(maxNum + 1).padStart(3, '0')}`
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
    <div style={{ padding: 28, maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/proyectos" style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'none', display: 'inline-block', marginBottom: 8 }}>
          ← Volver a proyectos
        </Link>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1a1d1e', margin: 0 }}>Nuevo proyecto</h1>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 24 }}>
        <NuevoProyectoForm
          clientes={clientes}
          usuarios={usuarios}
          codigoPreview={codigoPreview}
        />
      </div>
    </div>
  )
}
