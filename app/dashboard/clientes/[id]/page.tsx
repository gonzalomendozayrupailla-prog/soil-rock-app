'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { IconPencil, IconX, IconCheck } from '@tabler/icons-react'
import { AgregarContactoForm } from './contacto-form'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Contacto {
  id: string
  nombre: string
  cargo: string
  email: string
  telefono: string
  activo: boolean
}

interface Cliente {
  id: string
  razon_social: string
  ruc: string
  sector: string
  direccion: string | null
  created_at: string
  contactos: Contacto[]
}

const SECTORES = [
  'Minería', 'Construcción', 'Energía', 'Oil & Gas',
  'Infraestructura', 'Industria', 'Gobierno', 'Otro',
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ razon_social: '', ruc: '', sector: '', direccion: '' })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const fetchCliente = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/clientes/${id}`)
      if (res.status === 404) { setNotFound(true); return }
      if (res.ok) setCliente(await res.json())
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchCliente() }, [fetchCliente])

  function startEdit() {
    if (!cliente) return
    setEditForm({
      razon_social: cliente.razon_social,
      ruc: cliente.ruc,
      sector: cliente.sector,
      direccion: cliente.direccion ?? '',
    })
    setEditError('')
    setIsEditing(true)
  }

  async function handleSave() {
    if (!cliente) return
    setSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razon_social: editForm.razon_social,
          ruc: editForm.ruc,
          sector: editForm.sector,
          direccion: editForm.direccion || null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setCliente((prev) => prev ? { ...prev, ...updated } : prev)
        setIsEditing(false)
      } else {
        const d = await res.json()
        setEditError(d.error ?? 'Error al guardar')
      }
    } finally {
      setSaving(false)
    }
  }

  const inp: React.CSSProperties = {
    padding: '7px 10px', fontSize: 13,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none',
    color: '#1a1d1e', boxSizing: 'border-box', width: '100%',
  }

  const label: React.CSSProperties = {
    fontSize: 11, fontWeight: 500, color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4,
  }

  // ── Loading / not found ──────────────────────────────────────────────────

  if (loading) {
    return <div style={{ padding: 28, fontSize: 13, color: '#9ca3af' }}>Cargando...</div>
  }

  if (notFound || !cliente) {
    return (
      <div style={{ padding: 28 }}>
        <p style={{ fontSize: 13, color: '#a32d2d' }}>Cliente no encontrado.</p>
        <Link href="/dashboard/clientes" style={{ fontSize: 13, color: '#004aad' }}>← Volver a clientes</Link>
      </div>
    )
  }

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/clientes" style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'none', display: 'inline-block', marginBottom: 8 }}>
          ← Volver a clientes
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1a1d1e', margin: 0 }}>{cliente.razon_social}</h1>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0', fontFamily: 'monospace' }}>{cliente.ruc}</p>
          </div>
          {!isEditing ? (
            <button
              onClick={startEdit}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 500, color: '#004aad',
                padding: '7px 14px', borderRadius: 7,
                border: '0.5px solid #004aad', background: 'none', cursor: 'pointer',
              }}
            >
              <IconPencil size={13} /> Editar
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 500, color: '#ffffff',
                  padding: '7px 14px', borderRadius: 7,
                  border: 'none', backgroundColor: '#004aad', cursor: 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <IconCheck size={13} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, color: '#6b7280',
                  padding: '7px 12px', borderRadius: 7,
                  border: '0.5px solid #e8eaed', background: 'none', cursor: 'pointer',
                }}
              >
                <IconX size={13} /> Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Datos del cliente */}
        <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e', margin: '0 0 16px' }}>Datos del cliente</h2>

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={label}>Razón social *</label>
                <input value={editForm.razon_social} onChange={(e) => setEditForm((p) => ({ ...p, razon_social: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={label}>RUC *</label>
                <input value={editForm.ruc} onChange={(e) => setEditForm((p) => ({ ...p, ruc: e.target.value }))} maxLength={11} style={inp} />
              </div>
              <div>
                <label style={label}>Sector *</label>
                <select value={editForm.sector} onChange={(e) => setEditForm((p) => ({ ...p, sector: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">Seleccionar...</option>
                  {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Dirección</label>
                <input value={editForm.direccion} onChange={(e) => setEditForm((p) => ({ ...p, direccion: e.target.value }))} placeholder="Opcional" style={inp} />
              </div>
              {editError && <p style={{ fontSize: 12, color: '#a32d2d', margin: 0 }}>{editError}</p>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Campo label="Razón social">{cliente.razon_social}</Campo>
              <Campo label="RUC">{cliente.ruc}</Campo>
              <Campo label="Sector">{cliente.sector}</Campo>
              <Campo label="Dirección">{cliente.direccion ?? 'No registrada'}</Campo>
              <Campo label="Registrado el">
                {new Date(cliente.created_at).toLocaleDateString('es-PE')}
              </Campo>
            </div>
          )}
        </div>

        {/* Contactos */}
        <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e', margin: 0 }}>
              Contactos
              <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginLeft: 8, backgroundColor: '#f4f6f8', padding: '1px 7px', borderRadius: 999 }}>
                {cliente.contactos.length}
              </span>
            </h2>
            <AgregarContactoForm clienteId={id} onAdded={(c) => setCliente((prev) => prev ? { ...prev, contactos: [...prev.contactos, c] } : prev)} />
          </div>

          {cliente.contactos.length === 0 ? (
            <div style={{ border: '1px dashed #e8eaed', borderRadius: 8, padding: '32px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No hay contactos registrados.</p>
            </div>
          ) : (
            <div>
              {cliente.contactos.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: i < cliente.contactos.length - 1 ? '0.5px solid #f4f6f8' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e' }}>{c.nombre}</span>
                      {!c.activo && (
                        <span style={{ fontSize: 10, color: '#9ca3af', backgroundColor: '#f4f6f8', padding: '1px 6px', borderRadius: 999 }}>
                          Inactivo
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{c.cargo}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <a href={`mailto:${c.email}`} style={{ fontSize: 12, color: '#004aad', textDecoration: 'none' }}>{c.email}</a>
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>{c.telefono}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Campo({ label: lbl, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 3 }}>
        {lbl}
      </span>
      <span style={{ fontSize: 13, color: '#1a1d1e' }}>{children}</span>
    </div>
  )
}
