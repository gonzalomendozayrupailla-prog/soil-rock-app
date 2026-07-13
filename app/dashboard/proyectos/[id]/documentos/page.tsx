import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'

const ESTADOS: Record<string, string> = {
  borrador: 'Borrador',
  enviado_cliente: 'Enviado a cliente',
  con_observaciones: 'Con observaciones',
  aprobado: 'Aprobado',
}

const ESTADO_COLORS: Record<string, string> = {
  borrador: 'bg-zinc-100 text-zinc-500',
  enviado_cliente: 'bg-blue-50 text-blue-700',
  con_observaciones: 'bg-yellow-50 text-yellow-700',
  aprobado: 'bg-green-50 text-green-700',
}

export default async function DocumentosProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    select: { id: true, nombre: true, codigo: true },
  })

  if (!proyecto) notFound()

  const documentos = await prisma.documento.findMany({
    where: { proyecto_id: id },
    include: {
      subido: { select: { nombre: true } },
    },
    orderBy: { fecha_subida: 'desc' },
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href={`/dashboard/proyectos/${id}`}
            className="mb-2 inline-block text-sm text-zinc-500 hover:text-zinc-900"
          >
            &larr; {proyecto.codigo} — {proyecto.nombre}
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Documentos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {documentos.length} documento{documentos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href={`/dashboard/proyectos/${id}/documentos/nuevo`}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          + Subir documento
        </Link>
      </div>

      {documentos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 py-16 text-center">
          <p className="text-sm text-zinc-400">No hay documentos subidos aún.</p>
          <Link
            href={`/dashboard/proyectos/${id}/documentos/nuevo`}
            className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
          >
            Subir el primero
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Versión</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha subida</th>
                <th className="px-4 py-3">Subido por</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {documentos.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    <Link
                      href={`/dashboard/proyectos/${id}/documentos/${doc.id}`}
                      className="hover:underline"
                    >
                      {doc.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{doc.tipo}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{doc.version}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ESTADO_COLORS[doc.estado] ?? 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {ESTADOS[doc.estado] ?? doc.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(doc.fecha_subida).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{doc.subido.nombre}</td>
                  <td className="px-4 py-3">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:underline"
                    >
                      Ver archivo
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
