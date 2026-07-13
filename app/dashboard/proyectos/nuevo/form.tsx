'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Cliente = { id: string; razon_social: string }
type Usuario = { id: string; nombre: string; rol: string }

const FASES = [
  { value: 'pre_proyecto', label: 'Pre-proyecto' },
  { value: 'propuesta', label: 'Propuesta' },
  { value: 'negociacion', label: 'Negociación' },
  { value: 'adjudicado', label: 'Adjudicado' },
  { value: 'ejecucion', label: 'Ejecución' },
  { value: 'cierre', label: 'Cierre' },
  { value: 'cerrado', label: 'Cerrado' },
]

export function NuevoProyectoForm({
  clientes,
  usuarios,
  codigoPreview,
}: {
  clientes: Cliente[]
  usuarios: Usuario[]
  codigoPreview: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    cliente_id: '',
    sector: '',
    fase: 'pre_proyecto',
    ingeniero_id: '',
    fecha_inicio: '',
    fecha_cierre_estimada: '',
    monto_contrato: '',
    avance_general: '0',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monto_contrato: parseFloat(form.monto_contrato),
          avance_general: parseFloat(form.avance_general),
        }),
      })

      if (res.ok) {
        router.push('/dashboard/proyectos')
      } else {
        const data = await res.json()
        setError(data.error ?? 'Error al crear el proyecto')
      }
    } catch {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Código auto-generado */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700">Código</label>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
          <span className="font-mono text-sm font-semibold text-zinc-500">{codigoPreview}</span>
          <span className="text-xs text-zinc-400">(generado automáticamente)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Nombre */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="nombre" className="text-sm font-medium text-zinc-700">
            Nombre del proyecto <span className="text-red-500">*</span>
          </label>
          <input
            id="nombre"
            type="text"
            required
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
          />
        </div>

        {/* Cliente */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cliente_id" className="text-sm font-medium text-zinc-700">
            Cliente <span className="text-red-500">*</span>
          </label>
          <select
            id="cliente_id"
            required
            value={form.cliente_id}
            onChange={(e) => set('cliente_id', e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
          >
            <option value="">Seleccionar cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razon_social}
              </option>
            ))}
          </select>
        </div>

        {/* Sector */}
        <div className="flex flex-col gap-1">
          <label htmlFor="sector" className="text-sm font-medium text-zinc-700">
            Sector <span className="text-red-500">*</span>
          </label>
          <input
            id="sector"
            type="text"
            required
            placeholder="Ej: Minería, Construcción..."
            value={form.sector}
            onChange={(e) => set('sector', e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
          />
        </div>

        {/* Fase */}
        <div className="flex flex-col gap-1">
          <label htmlFor="fase" className="text-sm font-medium text-zinc-700">
            Fase <span className="text-red-500">*</span>
          </label>
          <select
            id="fase"
            required
            value={form.fase}
            onChange={(e) => set('fase', e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
          >
            {FASES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ingeniero responsable */}
        <div className="flex flex-col gap-1">
          <label htmlFor="ingeniero_id" className="text-sm font-medium text-zinc-700">
            Ingeniero responsable <span className="text-red-500">*</span>
          </label>
          <select
            id="ingeniero_id"
            required
            value={form.ingeniero_id}
            onChange={(e) => set('ingeniero_id', e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
          >
            <option value="">Seleccionar ingeniero</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} — {u.rol.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha inicio */}
        <div className="flex flex-col gap-1">
          <label htmlFor="fecha_inicio" className="text-sm font-medium text-zinc-700">
            Fecha de inicio <span className="text-red-500">*</span>
          </label>
          <input
            id="fecha_inicio"
            type="date"
            required
            value={form.fecha_inicio}
            onChange={(e) => set('fecha_inicio', e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
          />
        </div>

        {/* Fecha cierre estimada */}
        <div className="flex flex-col gap-1">
          <label htmlFor="fecha_cierre_estimada" className="text-sm font-medium text-zinc-700">
            Fecha cierre estimada <span className="text-red-500">*</span>
          </label>
          <input
            id="fecha_cierre_estimada"
            type="date"
            required
            value={form.fecha_cierre_estimada}
            onChange={(e) => set('fecha_cierre_estimada', e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
          />
        </div>

        {/* Monto contrato */}
        <div className="flex flex-col gap-1">
          <label htmlFor="monto_contrato" className="text-sm font-medium text-zinc-700">
            Monto del contrato (S/) <span className="text-red-500">*</span>
          </label>
          <input
            id="monto_contrato"
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.monto_contrato}
            onChange={(e) => set('monto_contrato', e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
          />
        </div>

        {/* Avance general */}
        <div className="flex flex-col gap-1">
          <label htmlFor="avance_general" className="text-sm font-medium text-zinc-700">
            Avance general (%)
          </label>
          <input
            id="avance_general"
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.avance_general}
            onChange={(e) => set('avance_general', e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Crear proyecto'}
        </button>
        <a
          href="/dashboard/proyectos"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
