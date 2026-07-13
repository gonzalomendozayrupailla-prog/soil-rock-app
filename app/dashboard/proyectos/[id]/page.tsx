import { notFound } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import ProyectoView from '@/app/components/ProyectoView'

export default async function ProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [proyecto, actividades, documentos, usuarios, valorizaciones] = await Promise.all([
    prisma.proyecto.findUnique({
      where: { id },
      include: {
        cliente: {
          include: {
            contactos: { where: { activo: true }, orderBy: { nombre: 'asc' } },
          },
        },
        ingeniero: { select: { nombre: true } },
      },
    }),
    prisma.actividad.findMany({
      where: { proyecto_id: id },
      include: { usuario: { select: { nombre: true } } },
      orderBy: { created_at: 'asc' },
    }),
    prisma.documento.findMany({
      where: { proyecto_id: id },
      include: { subido: { select: { nombre: true } } },
      orderBy: { fecha_subida: 'desc' },
    }),
    prisma.usuario.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
    prisma.valorizacion.findMany({
      where: { proyecto_id: id },
      select: { id: true, numero: true },
      orderBy: { numero: 'asc' },
    }),
  ])

  if (!proyecto) notFound()

  const serialized = {
    id: proyecto.id,
    codigo: proyecto.codigo,
    nombre: proyecto.nombre,
    sector: proyecto.sector,
    fase: proyecto.fase,
    monto_contrato: Number(proyecto.monto_contrato),
    avance_general: Number(proyecto.avance_general),
    fecha_inicio: proyecto.fecha_inicio.toISOString(),
    fecha_cierre_estimada: proyecto.fecha_cierre_estimada.toISOString(),
    created_at: proyecto.created_at.toISOString(),
    cliente: {
      id: proyecto.cliente.id,
      razon_social: proyecto.cliente.razon_social,
      ruc: proyecto.cliente.ruc,
      sector: proyecto.cliente.sector,
      direccion: proyecto.cliente.direccion,
      contactos: proyecto.cliente.contactos.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        cargo: c.cargo,
        email: c.email,
        telefono: c.telefono,
      })),
    },
    ingeniero: proyecto.ingeniero,
  }

  const serActividades = actividades.map((a) => ({
    id: a.id,
    tipo: a.tipo,
    descripcion: a.descripcion,
    created_at: a.created_at.toISOString(),
    usuario: a.usuario,
  }))

  const serDocumentos = documentos.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    tipo: d.tipo,
    version: d.version,
    estado: d.estado,
    url: d.url,
    es_interno: d.es_interno,
    fase_subida: d.fase_subida ?? null,
    fecha_subida: d.fecha_subida.toISOString(),
    subido: d.subido,
  }))

  return (
    <ProyectoView
      proyecto={serialized}
      actividadesIniciales={serActividades}
      documentosIniciales={serDocumentos}
      usuarios={usuarios}
      valorizacionesIniciales={valorizaciones}
    />
  )
}
