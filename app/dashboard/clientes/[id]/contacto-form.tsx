'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AgregarContactoForm({ clienteId }: { clienteId: string }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    cargo: '',
    email: '',
    telefono: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function cancelar() {
    setAbierto(false)
    setError('')
    setForm({ nombre: '', cargo: '', email: '', telefono: '' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/clientes/${clienteId}/contactos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        cancelar()
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Error al agregar contacto')
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        + Agregar contacto
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-700">Nuevo contacto</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="c-nombre" className="text-xs font-medium text-zinc-600">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="c-nombre"
              type="text"
              required
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="c-cargo" className="text-xs font-medium text-zinc-600">
              Cargo <span className="text-red-500">*</span>
            </label>
            <input
              id="c-cargo"
              type="text"
              required
              placeholder="Ej: Gerente de Proyectos"
              value={form.cargo}
              onChange={(e) => set('cargo', e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="c-email" className="text-xs font-medium text-zinc-600">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="c-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="c-telefono" className="text-xs font-medium text-zinc-600">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              id="c-telefono"
              type="tel"
              required
              placeholder="Ej: 999 123 456"
              value={form.telefono}
              onChange={(e) => set('telefono', e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar contacto'}
          </button>
          <button
            type="button"
            onClick={cancelar}
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
