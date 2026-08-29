'use client'

import { useState } from 'react'
import { IconPencil, IconCheck, IconX } from '@tabler/icons-react'

const DEFAULTS = { razon_social: 'Soil Rock S.A.C.', ruc: '' }

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, color: '#9ca3af',
  display: 'block', marginBottom: 4,
  textTransform: 'uppercase', letterSpacing: '0.04em',
}

const fieldStyle: React.CSSProperties = {
  fontSize: 13, color: '#1a1d1e', padding: '7px 10px',
  backgroundColor: '#f9fafb', border: '0.5px solid #e8eaed', borderRadius: 6,
}

const inputStyle: React.CSSProperties = {
  fontSize: 13, color: '#1a1d1e', padding: '7px 10px',
  backgroundColor: '#ffffff', border: '0.5px solid #d1d5db', borderRadius: 6,
  outline: 'none', width: '100%', boxSizing: 'border-box',
}

export default function ConfiguracionEmpresaForm({
  initialData,
  isGerente,
}: {
  initialData: { razon_social: string; ruc: string } | null
  isGerente: boolean
}) {
  const [data, setData]       = useState(initialData ?? DEFAULTS)
  const [form, setForm]       = useState(data)
  const [isEditing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  function openEdit() {
    setForm(data)
    setError(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError(null)
  }

  async function handleSave() {
    if (!form.razon_social.trim()) {
      setError('La razón social es requerida.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/configuracion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razon_social: form.razon_social.trim(), ruc: form.ruc.trim() }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Error al guardar')
        return
      }
      const updated = await res.json()
      setData({ razon_social: updated.razon_social, ruc: updated.ruc })
      setEditing(false)
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e', margin: 0 }}>Datos de la empresa</h2>
        {isGerente && !isEditing && (
          <button
            onClick={openEdit}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', fontSize: 12, fontWeight: 500,
              color: '#004aad', backgroundColor: 'transparent',
              border: '0.5px solid #004aad', borderRadius: 6, cursor: 'pointer',
            }}
          >
            <IconPencil size={13} />
            Editar
          </button>
        )}
        {isGerente && isEditing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={cancelEdit}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', fontSize: 12, fontWeight: 500,
                color: '#6b7280', backgroundColor: 'transparent',
                border: '0.5px solid #e8eaed', borderRadius: 6, cursor: 'pointer',
              }}
            >
              <IconX size={13} />
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', fontSize: 12, fontWeight: 500,
                color: '#ffffff', backgroundColor: '#004aad',
                border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              <IconCheck size={13} />
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Razón social</label>
          {isEditing ? (
            <input
              value={form.razon_social}
              onChange={(e) => setForm((p) => ({ ...p, razon_social: e.target.value }))}
              style={inputStyle}
              placeholder="Ej. Soil Rock S.A.C."
            />
          ) : (
            <div style={fieldStyle}>{data.razon_social || '—'}</div>
          )}
        </div>
        <div>
          <label style={labelStyle}>RUC</label>
          {isEditing ? (
            <input
              value={form.ruc}
              onChange={(e) => setForm((p) => ({ ...p, ruc: e.target.value }))}
              style={inputStyle}
              placeholder="Ej. 20123456789"
              maxLength={11}
            />
          ) : (
            <div style={fieldStyle}>{data.ruc || '—'}</div>
          )}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: '#dc2626', margin: '10px 0 0' }}>{error}</p>
      )}
    </div>
  )
}
