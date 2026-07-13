'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Estado = 'borrador' | 'enviado_cliente' | 'con_observaciones' | 'aprobado'

const ETIQUETAS: Record<Estado, string> = {
  borrador: 'Borrador',
  enviado_cliente: 'Enviado a cliente',
  con_observaciones: 'Con observaciones',
  aprobado: 'Aprobado',
}

const TRANSICIONES: Record<Estado, Array<{ valor: Estado; etiqueta: string }>> = {
  borrador: [{ valor: 'enviado_cliente', etiqueta: 'Enviar a cliente' }],
  enviado_cliente: [
    { valor: 'con_observaciones', etiqueta: 'Marcar con observaciones' },
    { valor: 'aprobado', etiqueta: 'Aprobar documento' },
  ],
  con_observaciones: [
    { valor: 'enviado_cliente', etiqueta: 'Reenviar a cliente' },
    { valor: 'aprobado', etiqueta: 'Aprobar documento' },
  ],
  aprobado: [],
}

const COLORES: Record<Estado, string> = {
  borrador: 'bg-zinc-100 text-zinc-500',
  enviado_cliente: 'bg-blue-50 text-blue-700',
  con_observaciones: 'bg-yellow-50 text-yellow-700',
  aprobado: 'bg-green-50 text-green-700',
}

const BOTONES: Record<Estado, string> = {
  borrador: 'border-zinc-200 text-zinc-700 hover:bg-zinc-50',
  enviado_cliente: 'border-blue-200 text-blue-700 hover:bg-blue-50',
  con_observaciones: 'border-yellow-200 text-yellow-700 hover:bg-yellow-50',
  aprobado: 'border-green-200 text-green-700 hover:bg-green-50',
}

export function EstadoForm({
  docId,
  estadoActual,
}: {
  docId: string
  estadoActual: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<Estado | null>(null)
  const [error, setError] = useState('')

  const estado = estadoActual as Estado
  const transiciones = TRANSICIONES[estado] ?? []

  async function cambiarEstado(nuevoEstado: Estado) {
    setLoading(nuevoEstado)
    setError('')
    try {
      const res = await fetch(`/api/documentos/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Error al cambiar estado')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500">Estado actual:</span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${COLORES[estado] ?? 'bg-zinc-100 text-zinc-500'}`}
        >
          {ETIQUETAS[estado] ?? estado}
        </span>
      </div>

      {transiciones.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-400">Cambiar a:</span>
          {transiciones.map((t) => (
            <button
              key={t.valor}
              onClick={() => cambiarEstado(t.valor)}
              disabled={loading !== null}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${BOTONES[t.valor]}`}
            >
              {loading === t.valor ? 'Guardando...' : t.etiqueta}
            </button>
          ))}
        </div>
      )}

      {estado === 'aprobado' && (
        <p className="text-sm text-green-600 font-medium">Documento aprobado — estado final.</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
