import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { AgregarContactoForm } from './contacto-form'

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</span>
      <span className="text-sm text-zinc-900">{children}</span>
    </div>
  )
}

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      contactos: { orderBy: { nombre: 'asc' } },
      _count: { select: { proyectos: true } },
    },
  })

  if (!cliente) notFound()

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/clientes"
            className="mb-2 inline-block text-sm text-zinc-500 hover:text-zinc-900"
          >
            &larr; Volver a clientes
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">{cliente.razon_social}</h1>
          <p className="mt-1 font-mono text-sm text-zinc-400">{cliente.ruc}</p>
        </div>
        <Link
          href={`/dashboard/clientes/${id}/editar`}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Datos del cliente */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-700">Datos del cliente</h2>
            <div className="flex flex-col gap-4">
              <Campo label="Razón social">{cliente.razon_social}</Campo>
              <Campo label="RUC">{cliente.ruc}</Campo>
              <Campo label="Sector">{cliente.sector}</Campo>
              <Campo label="Dirección">{cliente.direccion}</Campo>
              <Campo label="Proyectos asociados">
                {cliente._count.proyectos} proyecto{cliente._count.proyectos !== 1 ? 's' : ''}
              </Campo>
              <Campo label="Registrado el">
                {new Date(cliente.created_at).toLocaleDateString('es-PE')}
              </Campo>
            </div>
          </div>
        </div>

        {/* Contactos */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700">
                Contactos{' '}
                <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-normal text-zinc-500">
                  {cliente.contactos.length}
                </span>
              </h2>
              <AgregarContactoForm clienteId={id} />
            </div>

            {cliente.contactos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 py-8 text-center">
                <p className="text-sm text-zinc-400">No hay contactos registrados.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {cliente.contactos.map((c) => (
                  <div key={c.id} className="flex items-start justify-between py-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900">{c.nombre}</span>
                        {!c.activo && (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-400">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500">{c.cargo}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 text-xs text-zinc-500">
                      <a href={`mailto:${c.email}`} className="hover:underline">
                        {c.email}
                      </a>
                      <span>{c.telefono}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
