import { prisma } from '@/app/lib/prisma'
import PipelineView from './PipelineView'

export default async function PipelinePage() {
  const [oportunidades, clientes, todasCanceladas] = await Promise.all([
    prisma.proyecto.findMany({
      where: {
        fase: { in: ['pre_proyecto', 'propuesta', 'negociacion', 'adjudicado', 'en_pausa'] },
      },
      include: { cliente: { select: { razon_social: true } } },
      orderBy: { created_at: 'desc' },
    }),
    prisma.cliente.findMany({
      select: { id: true, razon_social: true },
      orderBy: { razon_social: 'asc' },
    }),
    prisma.proyecto.findMany({
      where: { fase: 'cancelado' },
      include: {
        cliente: { select: { razon_social: true } },
        actividades: {
          where: { tipo: 'nota' },
          orderBy: { created_at: 'desc' },
          take: 5,
        },
      },
      orderBy: { created_at: 'desc' },
    }),
  ])

  const serialized = oportunidades.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    fase: p.fase,
    sector: p.sector,
    monto_contrato: Number(p.monto_contrato),
    moneda: p.moneda,
    created_at: p.created_at.toISOString(),
    cliente: p.cliente,
  }))

  // Solo las canceladas que tienen "Motivo de pérdida" en sus actividades
  // = oportunidades que nunca llegaron a ejecución (se perdieron en pipeline)
  const perdidas = todasCanceladas
    .filter((p) => p.actividades.some((a) => a.descripcion.startsWith('Motivo de pérdida:')))
    .map((p) => {
      const notaMotivo = p.actividades.find((a) => a.descripcion.startsWith('Motivo de pérdida:'))
      return {
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        sector: p.sector,
        monto_contrato: Number(p.monto_contrato),
        moneda: p.moneda,
        created_at: p.created_at.toISOString(),
        cliente: p.cliente,
        motivo_perdida: notaMotivo
          ? notaMotivo.descripcion.replace('Motivo de pérdida: ', '')
          : null,
        fecha_perdida: notaMotivo ? notaMotivo.created_at.toISOString() : p.created_at.toISOString(),
      }
    })

  return <PipelineView oportunidades={serialized} clientes={clientes} perdidas={perdidas} />
}
