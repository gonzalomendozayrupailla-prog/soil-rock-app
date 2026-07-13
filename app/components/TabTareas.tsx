'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  IconPlus, IconCheck, IconX, IconChevronDown, IconChevronRight,
  IconCircle, IconCircleCheck, IconAlertTriangle, IconCalendar,
  IconUser, IconTrash, IconMessage, IconSend,
} from '@tabler/icons-react'

// Types
interface Usuario { id: string; nombre: string }
interface Subtarea { id: string; titulo: string; completada: boolean }
interface Comentario { id: string; contenido: string; created_at: string; usuario: Usuario }
interface Tarea {
  id: string; titulo: string; descripcion?: string | null; seccion: string
  estado: string; prioridad: string; fecha_limite?: string | null
  asignado?: Usuario | null; creador: Usuario
  subtareas: Subtarea[]; comentarios: Comentario[]
  created_at: string; updated_at: string
}

const PRIORIDAD_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  alta:  { bg: '#fcebeb', color: '#a32d2d', label: 'Alta' },
  media: { bg: '#faeeda', color: '#854f0b', label: 'Media' },
  baja:  { bg: '#f4f6f8', color: '#6b7280', label: 'Baja' },
}

const ESTADO_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pendiente:   { bg: '#f4f6f8', color: '#6b7280',  label: 'Pendiente' },
  en_progreso: { bg: '#e8f0fd', color: '#004aad',  label: 'En progreso' },
  completada:  { bg: '#eaf3de', color: '#3b6d11',  label: 'Completada' },
}

const SECCIONES_DEFAULT = ['Planificacion', 'En campo', 'En oficina', 'Entregables', 'Revision']

function diasDesde(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'hoy'
  if (d === 1) return '1 día'
  return `${d} días`
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

function isVencida(iso?: string | null) {
  if (!iso) return false
  const limite = new Date(iso); limite.setHours(0, 0, 0, 0)
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  return limite < hoy
}

export default function TabTareas({
  proyectoId,
  usuarios,
}: {
  proyectoId: string
  usuarios: Usuario[]
}) {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState<'lista' | 'board'>('lista')

  // Nueva tarea
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    titulo: '', descripcion: '', seccion: SECCIONES_DEFAULT[0],
    asignado_a: '', fecha_limite: '', prioridad: 'media',
  })
  const [saving, setSaving] = useState(false)

  // Panel lateral
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Comentario
  const [comentario, setComentario] = useState('')
  const [sendingComentario, setSendingComentario] = useState(false)

  // Nueva subtarea
  const [nuevaSubtarea, setNuevaSubtarea] = useState('')
  const [addingSubtarea, setAddingSubtarea] = useState(false)

  const fetchTareas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/tareas`)
      if (res.ok) setTareas(await res.json())
    } finally {
      setLoading(false)
    }
  }, [proyectoId])

  useEffect(() => { fetchTareas() }, [fetchTareas])

  const selected = tareas.find((t) => t.id === selectedId) ?? null

  async function handleCreate() {
    if (!form.titulo.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/tareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: form.titulo,
          descripcion: form.descripcion || undefined,
          seccion: form.seccion,
          asignado_a: form.asignado_a || undefined,
          fecha_limite: form.fecha_limite || undefined,
          prioridad: form.prioridad,
        }),
      })
      if (res.ok) {
        const nueva = await res.json()
        setTareas((prev) => [...prev, nueva])
        setForm({ titulo: '', descripcion: '', seccion: SECCIONES_DEFAULT[0], asignado_a: '', fecha_limite: '', prioridad: 'media' })
        setShowForm(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleEstado(tarea: Tarea, estado: string) {
    const res = await fetch(`/api/tareas/${tarea.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTareas((prev) => prev.map((t) => t.id === updated.id ? updated : t))
    }
  }

  async function handleDelete(tareaId: string) {
    const res = await fetch(`/api/tareas/${tareaId}`, { method: 'DELETE' })
    if (res.ok) {
      setTareas((prev) => prev.filter((t) => t.id !== tareaId))
      if (selectedId === tareaId) setSelectedId(null)
      setConfirmDeleteId(null)
    }
  }

  async function handleToggleSubtarea(tareaId: string, subtareaId: string, completada: boolean) {
    const res = await fetch(`/api/tareas/${tareaId}/subtareas/${subtareaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completada: !completada }),
    })
    if (res.ok) {
      const upd = await res.json()
      setTareas((prev) => prev.map((t) => t.id === tareaId
        ? { ...t, subtareas: t.subtareas.map((s) => s.id === subtareaId ? upd : s) }
        : t
      ))
    }
  }

  async function handleAddSubtarea(tareaId: string) {
    if (!nuevaSubtarea.trim()) return
    setAddingSubtarea(true)
    try {
      const res = await fetch(`/api/tareas/${tareaId}/subtareas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: nuevaSubtarea }),
      })
      if (res.ok) {
        const s = await res.json()
        setTareas((prev) => prev.map((t) => t.id === tareaId
          ? { ...t, subtareas: [...t.subtareas, s] }
          : t
        ))
        setNuevaSubtarea('')
      }
    } finally {
      setAddingSubtarea(false)
    }
  }

  async function handleComentario(tareaId: string) {
    if (!comentario.trim()) return
    setSendingComentario(true)
    try {
      const res = await fetch(`/api/tareas/${tareaId}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: comentario }),
      })
      if (res.ok) {
        const c = await res.json()
        setTareas((prev) => prev.map((t) => t.id === tareaId
          ? { ...t, comentarios: [...t.comentarios, c] }
          : t
        ))
        setComentario('')
      }
    } finally {
      setSendingComentario(false)
    }
  }

  async function handlePatchSelected(field: string, value: string | null) {
    if (!selected) return
    const res = await fetch(`/api/tareas/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTareas((prev) => prev.map((t) => t.id === updated.id ? updated : t))
    }
  }

  const secciones = SECCIONES_DEFAULT
  const inp: React.CSSProperties = {
    width: '100%', padding: '6px 10px', fontSize: 12,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none', boxSizing: 'border-box',
  }

  // Render Vista Board
  if (vista === 'board') {
    const estados = ['pendiente', 'en_progreso', 'completada']
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <VistaHeader vista={vista} setVista={setVista} showForm={showForm} setShowForm={setShowForm} />
        {showForm && (
          <FormNuevaTarea
            form={form} setForm={setForm}
            saving={saving} onSave={handleCreate} onCancel={() => setShowForm(false)}
            secciones={secciones} usuarios={usuarios} inp={inp}
          />
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {estados.map((estado) => {
            const s = ESTADO_STYLES[estado]
            const col = tareas.filter((t) => t.estado === estado)
            return (
              <div key={estado} style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 999, backgroundColor: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>{col.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.map((t) => (
                    <TarjetaBoard key={t.id} tarea={t} onSelect={() => setSelectedId(t.id)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        {selected && (
          <PanelLateral
            tarea={selected} usuarios={usuarios}
            onClose={() => { setSelectedId(null); setConfirmDeleteId(null) }}
            onEstado={(e) => handleEstado(selected, e)}
            onDelete={() => handleDelete(selected.id)}
            confirmDelete={confirmDeleteId === selected.id}
            onConfirmDelete={() => setConfirmDeleteId(selected.id)}
            onCancelDelete={() => setConfirmDeleteId(null)}
            onToggleSub={(sid, c) => handleToggleSubtarea(selected.id, sid, c)}
            onAddSub={() => handleAddSubtarea(selected.id)}
            nuevaSubtarea={nuevaSubtarea} setNuevaSubtarea={setNuevaSubtarea}
            addingSubtarea={addingSubtarea}
            comentario={comentario} setComentario={setComentario}
            onComentario={() => handleComentario(selected.id)}
            sendingComentario={sendingComentario}
            onPatch={handlePatchSelected}
            inp={inp}
          />
        )}
      </div>
    )
  }

  // Vista Lista
  const tareasNoCompletadas = tareas.filter((t) => t.estado !== 'completada')
  const tareasCompletadas   = tareas.filter((t) => t.estado === 'completada')

  return (
    <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
      {/* Lista principal */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <VistaHeader vista={vista} setVista={setVista} showForm={showForm} setShowForm={setShowForm} />

        {showForm && (
          <FormNuevaTarea
            form={form} setForm={setForm}
            saving={saving} onSave={handleCreate} onCancel={() => setShowForm(false)}
            secciones={secciones} usuarios={usuarios} inp={inp}
          />
        )}

        {loading ? (
          <p style={{ fontSize: 13, color: '#9ca3af', padding: '24px 0' }}>Cargando tareas...</p>
        ) : tareas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Sin tareas. Crea la primera.</p>
          </div>
        ) : (
          <>
            {secciones.map((seccion) => {
              const items = tareasNoCompletadas.filter((t) => t.seccion === seccion)
              if (items.length === 0) return null
              const open = !collapsed[seccion]
              return (
                <div key={seccion} style={{ marginBottom: 16 }}>
                  <button
                    onClick={() => setCollapsed((p) => ({ ...p, [seccion]: !p[seccion] }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 11, fontWeight: 600, color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '4px 0', marginBottom: 4,
                    }}
                  >
                    {open ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
                    {seccion} <span style={{ fontWeight: 400, color: '#b0b7c3' }}>({items.length})</span>
                  </button>
                  {open && (
                    <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 8, overflow: 'hidden' }}>
                      {items.map((t, i) => (
                        <FilaTarea
                          key={t.id}
                          tarea={t}
                          isLast={i === items.length - 1}
                          isSelected={selectedId === t.id}
                          onClick={() => setSelectedId(t.id === selectedId ? null : t.id)}
                          onToggle={() => handleEstado(t, t.estado === 'completada' ? 'pendiente' : 'completada')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Tareas sin sección conocida */}
            {(() => {
              const otros = tareasNoCompletadas.filter((t) => !secciones.includes(t.seccion))
              if (otros.length === 0) return null
              return (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0', marginBottom: 4 }}>
                    Otras
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 8, overflow: 'hidden' }}>
                    {otros.map((t, i) => (
                      <FilaTarea key={t.id} tarea={t} isLast={i === otros.length - 1}
                        isSelected={selectedId === t.id}
                        onClick={() => setSelectedId(t.id === selectedId ? null : t.id)}
                        onToggle={() => handleEstado(t, t.estado === 'completada' ? 'pendiente' : 'completada')}
                      />
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Completadas */}
            {tareasCompletadas.length > 0 && (
              <div>
                <button
                  onClick={() => setCollapsed((p) => ({ ...p, _completadas: !p._completadas }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 11, fontWeight: 600, color: '#3b6d11',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px 0', marginBottom: 4,
                  }}
                >
                  {!collapsed._completadas ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
                  Completadas <span style={{ fontWeight: 400, color: '#b0b7c3' }}>({tareasCompletadas.length})</span>
                </button>
                {!collapsed._completadas && (
                  <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 8, overflow: 'hidden', opacity: 0.7 }}>
                    {tareasCompletadas.map((t, i) => (
                      <FilaTarea key={t.id} tarea={t} isLast={i === tareasCompletadas.length - 1}
                        isSelected={selectedId === t.id}
                        onClick={() => setSelectedId(t.id === selectedId ? null : t.id)}
                        onToggle={() => handleEstado(t, 'pendiente')}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Panel lateral */}
      {selected && (
        <PanelLateral
          tarea={selected} usuarios={usuarios}
          onClose={() => { setSelectedId(null); setConfirmDeleteId(null) }}
          onEstado={(e) => handleEstado(selected, e)}
          onDelete={() => handleDelete(selected.id)}
          confirmDelete={confirmDeleteId === selected.id}
          onConfirmDelete={() => setConfirmDeleteId(selected.id)}
          onCancelDelete={() => setConfirmDeleteId(null)}
          onToggleSub={(sid, c) => handleToggleSubtarea(selected.id, sid, c)}
          onAddSub={() => handleAddSubtarea(selected.id)}
          nuevaSubtarea={nuevaSubtarea} setNuevaSubtarea={setNuevaSubtarea}
          addingSubtarea={addingSubtarea}
          comentario={comentario} setComentario={setComentario}
          onComentario={() => handleComentario(selected.id)}
          sendingComentario={sendingComentario}
          onPatch={handlePatchSelected}
          inp={inp}
        />
      )}
    </div>
  )
}

// Sub-componentes

function VistaHeader({
  vista, setVista, showForm, setShowForm,
}: {
  vista: string; setVista: (v: 'lista' | 'board') => void
  showForm: boolean; setShowForm: (v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {(['lista', 'board'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVista(v)}
            style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 6,
              border: '0.5px solid #e8eaed',
              backgroundColor: vista === v ? '#004aad' : '#ffffff',
              color: vista === v ? '#ffffff' : '#6b7280',
              cursor: 'pointer', fontWeight: vista === v ? 500 : 400,
            }}
          >
            {v === 'lista' ? 'Lista' : 'Board'}
          </button>
        ))}
      </div>
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 500,
          color: '#ffffff', backgroundColor: '#004aad',
          border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
        }}
      >
        <IconPlus size={13} /> Nueva tarea
      </button>
    </div>
  )
}

function FormNuevaTarea({
  form, setForm, saving, onSave, onCancel, secciones, usuarios, inp,
}: {
  form: { titulo: string; descripcion: string; seccion: string; asignado_a: string; fecha_limite: string; prioridad: string }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  saving: boolean; onSave: () => void; onCancel: () => void
  secciones: string[]; usuarios: { id: string; nombre: string }[]
  inp: React.CSSProperties
}) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 8, padding: 14, marginBottom: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <input
            autoFocus
            value={form.titulo}
            onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && onSave()}
            placeholder="Título de la tarea *"
            style={{ ...inp, fontSize: 13, fontWeight: 500 }}
          />
        </div>
        <select value={form.seccion} onChange={(e) => setForm((p) => ({ ...p, seccion: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
          {secciones.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={form.prioridad} onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
          <option value="baja">Prioridad: Baja</option>
          <option value="media">Prioridad: Media</option>
          <option value="alta">Prioridad: Alta</option>
        </select>
        <select value={form.asignado_a} onChange={(e) => setForm((p) => ({ ...p, asignado_a: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
          <option value="">Sin asignar</option>
          {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
        <input type="date" value={form.fecha_limite} onChange={(e) => setForm((p) => ({ ...p, fecha_limite: e.target.value }))} style={{ ...inp, cursor: 'pointer' }} />
        <div style={{ gridColumn: '1/-1' }}>
          <input
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Descripción (opcional)"
            style={inp}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onSave}
          disabled={!form.titulo.trim() || saving}
          style={{ fontSize: 12, fontWeight: 500, padding: '6px 16px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Guardando...' : 'Crear tarea'}
        </button>
        <button onClick={onCancel} style={{ fontSize: 12, padding: '6px 12px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

function FilaTarea({
  tarea, isLast, isSelected, onClick, onToggle,
}: {
  tarea: Tarea; isLast: boolean; isSelected: boolean
  onClick: () => void; onToggle: () => void
}) {
  const pStyle = PRIORIDAD_STYLES[tarea.prioridad]
  const eStyle = ESTADO_STYLES[tarea.estado]
  const vencida = isVencida(tarea.fecha_limite) && tarea.estado !== 'completada'

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 14px',
        borderBottom: isLast ? 'none' : '0.5px solid #f4f6f8',
        cursor: 'pointer',
        backgroundColor: isSelected ? '#f0f6ff' : 'transparent',
        transition: 'background-color 0.1s',
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, color: tarea.estado === 'completada' ? '#3b6d11' : '#d1d5db' }}
      >
        {tarea.estado === 'completada' ? <IconCircleCheck size={16} /> : <IconCircle size={16} />}
      </button>

      <span style={{
        flex: 1, fontSize: 13, color: tarea.estado === 'completada' ? '#9ca3af' : '#1a1d1e',
        textDecoration: tarea.estado === 'completada' ? 'line-through' : 'none',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {tarea.titulo}
      </span>

      {tarea.asignado && (
        <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{tarea.asignado.nombre}</span>
      )}

      {tarea.fecha_limite && (
        <span style={{ fontSize: 11, color: vencida ? '#a32d2d' : '#9ca3af', flexShrink: 0 }}>
          {vencida && <IconAlertTriangle size={11} style={{ marginRight: 2, verticalAlign: 'middle' }} />}
          {formatFecha(tarea.fecha_limite)}
        </span>
      )}

      <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 7px', borderRadius: 999, backgroundColor: pStyle.bg, color: pStyle.color, flexShrink: 0 }}>
        {pStyle.label}
      </span>
      <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 7px', borderRadius: 999, backgroundColor: eStyle.bg, color: eStyle.color, flexShrink: 0 }}>
        {eStyle.label}
      </span>
    </div>
  )
}

function TarjetaBoard({ tarea, onSelect }: { tarea: Tarea; onSelect: () => void }) {
  const pStyle = PRIORIDAD_STYLES[tarea.prioridad]
  const vencida = isVencida(tarea.fecha_limite) && tarea.estado !== 'completada'
  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 7,
        padding: '10px 12px', cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1d1e', marginBottom: 6, lineHeight: 1.4 }}>{tarea.titulo}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999, backgroundColor: pStyle.bg, color: pStyle.color }}>{pStyle.label}</span>
        {tarea.fecha_limite && (
          <span style={{ fontSize: 10, color: vencida ? '#a32d2d' : '#9ca3af' }}>
            {formatFecha(tarea.fecha_limite)}
          </span>
        )}
        {tarea.asignado && <span style={{ fontSize: 10, color: '#9ca3af' }}>{tarea.asignado.nombre}</span>}
      </div>
    </div>
  )
}

function PanelLateral({
  tarea, usuarios, onClose, onEstado, onDelete,
  confirmDelete, onConfirmDelete, onCancelDelete,
  onToggleSub, onAddSub, nuevaSubtarea, setNuevaSubtarea, addingSubtarea,
  comentario, setComentario, onComentario, sendingComentario,
  onPatch, inp,
}: {
  tarea: Tarea; usuarios: { id: string; nombre: string }[]
  onClose: () => void
  onEstado: (e: string) => void
  onDelete: () => void
  confirmDelete: boolean
  onConfirmDelete: () => void
  onCancelDelete: () => void
  onToggleSub: (id: string, completada: boolean) => void
  onAddSub: () => void
  nuevaSubtarea: string; setNuevaSubtarea: (v: string) => void
  addingSubtarea: boolean
  comentario: string; setComentario: (v: string) => void
  onComentario: () => void; sendingComentario: boolean
  onPatch: (field: string, value: string | null) => void
  inp: React.CSSProperties
}) {
  const eStyle = ESTADO_STYLES[tarea.estado]
  const completadas = tarea.subtareas.filter((s) => s.completada).length

  return (
    <div style={{
      width: 340, minWidth: 340, marginLeft: 16,
      backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10,
      padding: 18, height: 'fit-content', maxHeight: '80vh', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1a1d1e', lineHeight: 1.4, paddingRight: 8 }}>
          {tarea.titulo}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', flexShrink: 0 }}>
          <IconX size={16} />
        </button>
      </div>

      {/* Estado */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Estado</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['pendiente', 'en_progreso', 'completada'] as const).map((e) => {
            const s = ESTADO_STYLES[e]
            return (
              <button
                key={e}
                onClick={() => onEstado(e)}
                style={{
                  fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 999,
                  border: tarea.estado === e ? `1.5px solid ${s.color}` : '1.5px solid transparent',
                  backgroundColor: s.bg, color: s.color, cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Asignado */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Asignado a</div>
        <select
          value={tarea.asignado?.id ?? ''}
          onChange={(e) => onPatch('asignado_a', e.target.value || null)}
          style={{ ...inp, fontSize: 12 }}
        >
          <option value="">Sin asignar</option>
          {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </div>

      {/* Fecha */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Fecha límite</div>
        <input
          type="date"
          value={tarea.fecha_limite ? tarea.fecha_limite.slice(0, 10) : ''}
          onChange={(e) => onPatch('fecha_limite', e.target.value || null)}
          style={{ ...inp, fontSize: 12 }}
        />
      </div>

      {/* Descripción */}
      {tarea.descripcion && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Descripción</div>
          <p style={{ fontSize: 12, color: '#5b5b5b', margin: 0, lineHeight: 1.5 }}>{tarea.descripcion}</p>
        </div>
      )}

      {/* Subtareas */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
          Subtareas {tarea.subtareas.length > 0 && `(${completadas}/${tarea.subtareas.length})`}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
          {tarea.subtareas.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <button
                onClick={() => onToggleSub(s.id, s.completada)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: s.completada ? '#3b6d11' : '#d1d5db', flexShrink: 0 }}
              >
                {s.completada ? <IconCheck size={14} /> : <IconCircle size={14} />}
              </button>
              <span style={{ fontSize: 12, color: s.completada ? '#9ca3af' : '#1a1d1e', textDecoration: s.completada ? 'line-through' : 'none' }}>
                {s.titulo}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={nuevaSubtarea}
            onChange={(e) => setNuevaSubtarea(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddSub()}
            placeholder="Nueva subtarea..."
            style={{ ...inp, flex: 1, fontSize: 11 }}
          />
          <button
            onClick={onAddSub}
            disabled={!nuevaSubtarea.trim() || addingSubtarea}
            style={{ fontSize: 11, padding: '4px 8px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', opacity: addingSubtarea ? 0.5 : 1 }}
          >
            +
          </button>
        </div>
      </div>

      {/* Comentarios */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
          <IconMessage size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
          Comentarios ({tarea.comentarios.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {tarea.comentarios.map((c) => (
            <div key={c.id} style={{ backgroundColor: '#f9fafb', borderRadius: 6, padding: '7px 9px' }}>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>
                {c.usuario.nombre} · {new Date(c.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
              </div>
              <p style={{ fontSize: 12, color: '#1a1d1e', margin: 0 }}>{c.contenido}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onComentario()}
            placeholder="Escribir comentario..."
            style={{ ...inp, flex: 1, fontSize: 11 }}
          />
          <button
            onClick={onComentario}
            disabled={!comentario.trim() || sendingComentario}
            style={{ padding: '4px 8px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', opacity: sendingComentario ? 0.5 : 1 }}
          >
            <IconSend size={12} />
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div style={{ borderTop: '0.5px solid #f4f6f8', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#b0b7c3' }}>
          <IconUser size={10} style={{ marginRight: 2, verticalAlign: 'middle' }} />
          {tarea.creador.nombre} · {diasDesde(tarea.created_at)}
        </span>
        {confirmDelete ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              onClick={onDelete}
              style={{ fontSize: 11, padding: '3px 8px', backgroundColor: '#a32d2d', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}
            >
              Confirmar
            </button>
            <button
              onClick={onCancelDelete}
              style={{ fontSize: 11, padding: '3px 8px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 5, background: 'none', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={onConfirmDelete}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a32d2d', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <IconTrash size={12} /> Eliminar
          </button>
        )}
      </div>
    </div>
  )
}
