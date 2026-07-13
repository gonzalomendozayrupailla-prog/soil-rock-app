'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NuevoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    razon_social: '',
    ruc: '',
    sector: '',
    direccion: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/dashboard/clientes/${data.id}`)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Error al crear el cliente')
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/clientes"
          className="mb-2 inline-block text-sm text-zinc-500 hover:text-zinc-900"
        >
          &larr; Volver a clientes
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Nuevo cliente</h1>
      </div>

      <div className="max-w-lg rounded-xl border border-zinc-200 bg-white p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="razon_social" className="text-sm font-medium text-zinc-700">
              Razón social <span className="text-red-500">*</span>
            </label>
            <input
              id="razon_social"
              type="text"
              required
              value={form.razon_social}
              onChange={(e) => set('razon_social', e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="ruc" className="text-sm font-medium text-zinc-700">
              RUC <span className="text-red-500">*</span>
            </label>
            <input
              id="ruc"
              type="text"
              required
              maxLength={11}
              placeholder="20XXXXXXXXX"
              value={form.ruc}
              onChange={(e) => set('ruc', e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="sector" className="text-sm font-medium text-zinc-700">
              Sector <span className="text-red-500">*</span>
            </label>
            <input
              id="sector"
              type="text"
              required
              placeholder="Ej: Minería, Construcción, Energía..."
              value={form.sector}
              onChange={(e) => set('sector', e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="direccion" className="text-sm font-medium text-zinc-700">
              Dirección <span className="text-red-500">*</span>
            </label>
            <input
              id="direccion"
              type="text"
              required
              value={form.direccion}
              onChange={(e) => set('direccion', e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Crear cliente'}
            </button>
            <Link
              href="/dashboard/clientes"
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
