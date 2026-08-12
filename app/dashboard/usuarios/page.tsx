'use client'

import { useState, useEffect } from 'react'
import { IconPlus, IconX, IconCheck, IconPencil } from '@tabler/icons-react'

interface Usuario {
  id: string; nombre: string; correo: string; rol: string
  permisos: Record<string, boolean>; activo: boolean; created_at: string
}

const ROLES = [
  { value: 'gerente',              label: 'Gerente' },
  { value: 'ingeniero_residente',  label: 'Ing. Residente' },
  { value: 'administrativo',       label: 'Administrativo' },
  { value: 'campo',                label: 'Campo' },
]

const ROL_BADGE: Record<string, { bg: string; color: string }> = {
  gerente:             { bg: '#e8f0fd', color: '#004aad' },
  ingeniero_residente: { bg: '#eaf3de', color: '#3b6d11' },
  administrativo:      { bg: '#faeeda', color: '#854f0b' },
  campo:               { bg: '#f4f6f8', color: '#6b7280' },
}

const PERMISOS_LIST = [
  { key: 'ver_proyectos',         label: 'Ver proyectos' },
  { key: 'editar_proyectos',      label: 'Editar proyectos' },
  { key: 'ver_documentos',        label: 'Ver documentos' },
  { key: 'subir_documentos',      label: 'Subir documentos' },
  { key: 'ver_reportes_campo',    label: 'Ver reportes campo' },
  { key: 'editar_reportes_campo', label: 'Editar reportes campo' },
  { key: 'ver_dashboard',         label: 'Ver dashboard' },
  { key: 'ver_montos',            label: 'Ver montos' },
  { key: 'ver_comercial',         label: 'Ver sección comercial' },
]

const PERMISOS_DEFAULT: Record<string, boolean> = {
  ver_proyectos: true, editar_proyectos: false,
  ver_documentos: true, subir_documentos: false,
  ver_reportes_campo: true, editar_reportes_campo: false,
  ver_dashboard: true, ver_montos: false,
  ver_comercial: true,
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form nueva usuario
  const [form, setForm] = useState({
    nombre: '', correo: '', password: '', rol: 'ingeniero_residente',
    permisos: { ...PERMISOS_DEFAULT },
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetch('/api/usuarios')
      .then((r) => {
        if (r.status === 403) { setError('Sin acceso — Solo el gerente puede ver esta sección'); setLoading(false); return null }
        return r.json()
      })
      .then((data) => { if (data) { setUsuarios(Array.isArray(data) ? data : []); setLoading(false) } })
      .catch(() => { setError('Error al cargar usuarios'); setLoading(false) })
  }, [])

  async function handleCreate() {
    if (!form.nombre || !form.correo || !form.password) {
      setFormError('Nombre, correo y contrasena son requeridos'); return
    }
    setSaving(true); setFormError('')
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'Error al crear usuario'); return }
      setUsuarios((prev) => [...prev, data])
      setShowForm(false)
      setForm({ nombre: '', correo: '', password: '', rol: 'ingeniero_residente', permisos: { ...PERMISOS_DEFAULT } })
    } finally {
      setSaving(false)
    }
  }

  async function toggleActivo(usuario: Usuario) {
    const res = await fetch(`/api/usuarios/${usuario.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !usuario.activo }),
    })
    if (res.ok) {
      const upd = await res.json()
      setUsuarios((prev) => prev.map((u) => u.id === usuario.id ? upd : u))
    }
  }

  async function savePermisos(usuario: Usuario, permisos: Record<string, boolean>) {
    const res = await fetch(`/api/usuarios/${usuario.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permisos }),
    })
    if (res.ok) {
      const upd = await res.json()
      setUsuarios((prev) => prev.map((u) => u.id === usuario.id ? upd : u))
      setEditingId(null)
    }
  }

  const [editingPermisos, setEditingPermisos] = useState<Record<string, boolean>>({})

  function startEditPermisos(u: Usuario) {
    setEditingId(u.id)
    setEditingPermisos({ ...u.permisos })
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: 13,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: '#1a1d1e', margin: 0 }}>Usuarios</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '3px 0 0' }}>Gestiona el acceso y permisos del equipo</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#ffffff', backgroundColor: '#004aad', border: 'none', borderRadius: 7, padding: '8px 16px', cursor: 'pointer' }}
        >
          <IconPlus size={14} /> Nuevo usuario
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1d1e' }}>Crear usuario</span>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={16} /></button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Nombre completo *</label>
              <input value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Correo *</label>
              <input type="email" value={form.correo} onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Contrasena inicial *</label>
              <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Rol</label>
              <select value={form.rol} onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Permisos</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {PERMISOS_LIST.map((p) => (
                <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, cursor: 'pointer', padding: '5px 8px', borderRadius: 6, border: '0.5px solid #e8eaed', backgroundColor: form.permisos[p.key] ? '#e8f0fd' : '#f9fafb' }}>
                  <input
                    type="checkbox"
                    checked={!!form.permisos[p.key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, permisos: { ...prev.permisos, [p.key]: e.target.checked } }))}
                    style={{ accentColor: '#004aad' }}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>

          {formError && <p style={{ fontSize: 12, color: '#a32d2d', marginBottom: 10 }}>{formError}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCreate} disabled={saving} style={{ fontSize: 13, fontWeight: 500, padding: '7px 20px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Creando...' : 'Crear usuario'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ fontSize: 13, padding: '7px 14px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ fontSize: 13, color: '#a32d2d', marginBottom: 16 }}>{error}</p>}

      {loading ? (
        <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {usuarios.map((u) => {
            const badge = ROL_BADGE[u.rol] ?? ROL_BADGE.campo
            const isEditing = editingId === u.id
            return (
              <div key={u.id} style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, overflow: 'hidden' }}>
                {/* Header del usuario */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    backgroundColor: u.activo ? '#004aad' : '#e8eaed', color: u.activo ? '#ffffff' : '#9ca3af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {u.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: u.activo ? '#1a1d1e' : '#9ca3af' }}>{u.nombre}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, backgroundColor: badge.bg, color: badge.color }}>
                        {ROLES.find((r) => r.value === u.rol)?.label ?? u.rol}
                      </span>
                      {!u.activo && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, backgroundColor: '#f4f6f8', color: '#9ca3af' }}>
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{u.correo}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => isEditing ? setEditingId(null) : startEditPermisos(u)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: isEditing ? '#004aad' : '#6b7280', background: 'none', border: '0.5px solid #e8eaed', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}
                    >
                      <IconPencil size={12} /> Permisos
                    </button>
                    <button
                      onClick={() => toggleActivo(u)}
                      style={{
                        fontSize: 12, padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                        border: 'none',
                        backgroundColor: u.activo ? '#fcebeb' : '#eaf3de',
                        color: u.activo ? '#a32d2d' : '#3b6d11',
                      }}
                    >
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>

                {/* Panel de permisos */}
                {isEditing && (
                  <div style={{ borderTop: '0.5px solid #f4f6f8', padding: '14px 18px', backgroundColor: '#f9fafb' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Permisos</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                      {PERMISOS_LIST.map((p) => (
                        <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, cursor: 'pointer', padding: '5px 8px', borderRadius: 6, border: '0.5px solid #e8eaed', backgroundColor: editingPermisos[p.key] ? '#e8f0fd' : '#ffffff' }}>
                          <input
                            type="checkbox"
                            checked={!!editingPermisos[p.key]}
                            onChange={(e) => setEditingPermisos((prev) => ({ ...prev, [p.key]: e.target.checked }))}
                            style={{ accentColor: '#004aad' }}
                          />
                          {p.label}
                        </label>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => savePermisos(u, editingPermisos)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, padding: '6px 14px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      >
                        <IconCheck size={13} /> Guardar permisos
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ fontSize: 12, padding: '6px 12px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
