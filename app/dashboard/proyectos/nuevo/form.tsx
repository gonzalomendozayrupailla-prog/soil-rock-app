'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

const SECTORES = [
  'Minería', 'Construcción', 'Energía', 'Oil & Gas',
  'Infraestructura', 'Industria', 'Gobierno', 'Otro',
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
    moneda: 'PEN',
    monto_contrato: '',
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

  const inp: React.CSSProperties = {
    padding: '7px 10px', fontSize: 13,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none',
    color: '#1a1d1e', boxSizing: 'border-box', width: '100%',
  }

  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5,
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Código auto-generado */}
      <div>
        <label style={lbl}>Código</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', backgroundColor: '#f9fafb', border: '0.5px solid #e8eaed', borderRadius: 6 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#004aad' }}>{codigoPreview}</span>
          <span style={{ fontSize: 11, color: '#b0b7c3' }}>(generado automáticamente)</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Nombre */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={lbl}>Nombre del proyecto *</label>
          <input type="text" required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} style={inp} />
        </div>

        {/* Cliente */}
        <div>
          <label style={lbl}>Cliente *</label>
          <select required value={form.cliente_id} onChange={(e) => set('cliente_id', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            <option value="">Seleccionar cliente</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
          </select>
        </div>

        {/* Sector */}
        <div>
          <label style={lbl}>Sector *</label>
          <select required value={form.sector} onChange={(e) => set('sector', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            <option value="">Seleccionar sector...</option>
            {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Fase */}
        <div>
          <label style={lbl}>Fase *</label>
          <select required value={form.fase} onChange={(e) => set('fase', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            {FASES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        {/* Ingeniero */}
        <div>
          <label style={lbl}>Ingeniero responsable *</label>
          <select required value={form.ingeniero_id} onChange={(e) => set('ingeniero_id', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            <option value="">Seleccionar ingeniero</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre} — {u.rol.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        {/* Fecha inicio */}
        <div>
          <label style={lbl}>Fecha de inicio *</label>
          <input type="date" required value={form.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} style={{ ...inp, cursor: 'pointer' }} />
        </div>

        {/* Fecha cierre estimada */}
        <div>
          <label style={lbl}>Fecha cierre estimada *</label>
          <input type="date" required value={form.fecha_cierre_estimada} onChange={(e) => set('fecha_cierre_estimada', e.target.value)} style={{ ...inp, cursor: 'pointer' }} />
        </div>

        {/* Moneda */}
        <div>
          <label style={lbl}>Moneda</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['PEN', 'USD'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set('moneda', m)}
                style={{
                  flex: 1, padding: '7px 0', fontSize: 13, fontWeight: 500,
                  borderRadius: 6, cursor: 'pointer',
                  border: form.moneda === m ? 'none' : '0.5px solid #e8eaed',
                  backgroundColor: form.moneda === m ? '#004aad' : '#ffffff',
                  color: form.moneda === m ? '#ffffff' : '#6b7280',
                }}
              >
                {m === 'PEN' ? 'S/ Soles' : 'US$ Dólares'}
              </button>
            ))}
          </div>
        </div>

        {/* Monto */}
        <div>
          <label style={lbl}>Monto del contrato ({form.moneda === 'USD' ? 'US$' : 'S/'}) *</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.monto_contrato}
            onChange={(e) => set('monto_contrato', e.target.value)}
            style={inp}
          />
        </div>

      </div>

      {error && <p style={{ fontSize: 13, color: '#a32d2d', margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            fontSize: 13, fontWeight: 600, padding: '8px 20px',
            backgroundColor: '#004aad', color: '#ffffff',
            border: 'none', borderRadius: 7, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Guardando...' : 'Crear proyecto'}
        </button>
        <Link href="/dashboard/proyectos" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}>
          Cancelar
        </Link>
      </div>
    </form>
  )
}
