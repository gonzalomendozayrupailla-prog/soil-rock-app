import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { EstadoForm } from './estado-form'

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</span>
      <span className="text-sm text-zinc-900">{children}</span>
    </div>
  )
}

export default async function DocumentoDetallePage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>
}) {
  const { id: proyectoId, docId } = await params

  const [proyecto, documento] = await Promise.all([
    prisma.proyecto.findUnique({
      where: { id: proyectoId },
      select: { id: true, nombre: true, codigo: true },
    }),
    prisma.documento.findUnique({
      where: { id: docId },
      include: {
        subido: { select: { nombre: true, correo: true } },
      },
    }),
  ])

  if (!proyecto || !documento || documento.proyecto_id !== proyectoId) notFound()

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href={`/dashboard/proyectos/${proyectoId}/documentos`}
          className="mb-2 inline-block text-sm text-zinc-500 hover:text-zinc-900"
        >
          &larr; {proyecto.codigo} — Documentos
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">{documento.nombre}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {documento.tipo} · versión {documento.version}
          {documento.es_interno && (
            <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
              Interno
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna principal — estado */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Control de estado */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-700">Estado del documento</h2>
            <EstadoForm docId={docId} estadoActual={documento.estado} />
          </div>

          {/* Vista previa / enlace */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-700">Archivo</h2>
            <a
              href={documento.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Abrir archivo en nueva pestaña &rarr;
            </a>
            <p className="mt-2 break-all text-xs text-zinc-400">{documento.url}</p>
          </div>
        </div>

        {/* Columna lateral — metadatos */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-700">Metadatos</h2>
            <div className="flex flex-col gap-4">
              <Campo label="Tipo">{documento.tipo}</Campo>
              <Campo label="Versión">{documento.version}</Campo>
              <Campo label="Visibilidad">
                {documento.es_interno ? 'Interno' : 'Cliente'}
              </Campo>
              <Campo label="Fecha de subida">
                {new Date(documento.fecha_subida).toLocaleDateString('es-PE', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </Campo>
              <Campo label="Subido por">
                {documento.subido.nombre}
                <span className="block text-xs text-zinc-400">{documento.subido.correo}</span>
              </Campo>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
