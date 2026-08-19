'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SECTORES = [
  'Minería', 'Construcción', 'Energía', 'Oil & Gas',
  'Infraestructura', 'Industria', 'Gobierno', 'Otro',
]

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

  const inp: React.CSSProperties = {
    padding: '7px 10px', fontSize: 13,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none',
    color: '#1a1d1e', boxSizing: 'border-box', width: '100%',
  }

  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 5,
  }

  return (
    <div style={{ padding: 28, maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/clientes" style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'none', display: 'inline-block', marginBottom: 8 }}>
          ← Volver a clientes
        </Link>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1a1d1e', margin: 0 }}>Nuevo cliente</h1>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Razón social *</label>
            <input
              type="text"
              required
              value={form.razon_social}
              onChange={(e) => set('razon_social', e.target.value)}
              style={inp}
            />
          </div>

          <div>
            <label style={lbl}>RUC *</label>
            <input
              type="text"
              required
              maxLength={11}
              placeholder="20XXXXXXXXX"
              value={form.ruc}
              onChange={(e) => set('ruc', e.target.value)}
              style={inp}
            />
          </div>

          <div>
            <label style={lbl}>Sector *</label>
            <select
              required
              value={form.sector}
              onChange={(e) => set('sector', e.target.value)}
              style={{ ...inp, cursor: 'pointer' }}
            >
              <option value="">Seleccionar sector...</option>
              {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Dirección <span style={{ fontWeight: 400, color: '#b0b7c3' }}>(opcional)</span></label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => set('direccion', e.target.value)}
              style={inp}
            />
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
              {loading ? 'Guardando...' : 'Crear cliente'}
            </button>
            <Link href="/dashboard/clientes" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}>
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
