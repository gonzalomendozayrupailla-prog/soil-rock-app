import { prisma } from '@/app/lib/prisma'
import ProyectosView from './ProyectosView'

export default async function ProyectosPage() {
  const proyectos = await prisma.proyecto.findMany({
    where: {
      fase: { in: ['adjudicado', 'ejecucion', 'cierre', 'cerrado', 'cancelado'] },
    },
    include: {
      cliente: { select: { razon_social: true } },
      ingeniero: { select: { nombre: true } },
    },
    orderBy: { created_at: 'desc' },
  })

  const serialized = proyectos.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    fase: p.fase,
    sector: p.sector,
    monto_contrato: Number(p.monto_contrato),
    avance_general: Number(p.avance_general),
    fecha_inicio: p.fecha_inicio.toISOString(),
    fecha_cierre_estimada: p.fecha_cierre_estimada.toISOString(),
    cliente: p.cliente,
    ingeniero: p.ingeniero,
  }))

  return <ProyectosView proyectos={serialized} />
}
