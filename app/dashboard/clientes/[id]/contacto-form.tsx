'use client'

import { useState } from 'react'

interface Contacto {
  id: string
  nombre: string
  cargo: string
  email: string
  telefono: string
  activo: boolean
}

export function AgregarContactoForm({
  clienteId,
  onAdded,
}: {
  clienteId: string
  onAdded: (contacto: Contacto) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ nombre: '', cargo: '', email: '', telefono: '' })

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
        const nuevo = await res.json()
        onAdded(nuevo)
        cancelar()
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

  const inp: React.CSSProperties = {
    padding: '7px 10px', fontSize: 12,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none',
    color: '#1a1d1e', boxSizing: 'border-box', width: '100%',
    backgroundColor: '#ffffff',
  }

  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 500, color: '#9ca3af', display: 'block', marginBottom: 3,
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        style={{
          fontSize: 12, fontWeight: 500, color: '#004aad',
          padding: '5px 12px', borderRadius: 6,
          border: '0.5px solid #004aad', background: 'none', cursor: 'pointer',
        }}
      >
        + Agregar contacto
      </button>
    )
  }

  return (
    <div style={{ backgroundColor: '#f9fafb', border: '0.5px solid #e8eaed', borderRadius: 8, padding: 16, marginTop: 12, width: '100%' }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e', margin: '0 0 12px' }}>Nuevo contacto</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={lbl}>Nombre *</label>
            <input type="text" required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Cargo *</label>
            <input type="text" required placeholder="Ej: Gerente de Proyectos" value={form.cargo} onChange={(e) => set('cargo', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Email *</label>
            <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Teléfono *</label>
            <input type="tel" required placeholder="Ej: 999 123 456" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} style={inp} />
          </div>
        </div>

        {error && <p style={{ fontSize: 12, color: '#a32d2d', margin: '0 0 8px' }}>{error}</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              fontSize: 12, fontWeight: 500, padding: '6px 16px',
              backgroundColor: '#004aad', color: '#ffffff',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Guardando...' : 'Guardar contacto'}
          </button>
          <button
            type="button"
            onClick={cancelar}
            style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
