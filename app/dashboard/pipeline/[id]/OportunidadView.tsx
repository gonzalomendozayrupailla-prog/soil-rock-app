'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconArrowLeft, IconPencil, IconCheck, IconX,
  IconNote, IconPhone, IconUsers, IconFileImport,
  IconFileExport, IconArrowRight, IconSend, IconMessage,
  IconRocket, IconPlayerPause, IconPlayerPlay,
  IconAlertTriangle, IconFileText,
} from '@tabler/icons-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Contacto { id: string; nombre: string; cargo: string; email: string; telefono: string }
interface Cliente  { id: string; razon_social: string; ruc: string; sector: string; direccion: string; contactos: Contacto[] }
interface Proyecto {
  id: string; codigo: string; nombre: string; sector: string; fase: string
  monto_contrato: number; avance_general: number
  fecha_inicio: string; fecha_cierre_estimada: string; created_at: string
  cliente: Cliente; ingeniero: { nombre: string }
}
interface Actividad {
  id: string; tipo: string; descripcion: string; created_at: string
  usuario: { nombre: string }
}
interface Documento {
  id: string; nombre: string; tipo: string; version: string; estado: string
  url: string; es_interno: boolean; fecha_subida: string
  subido: { nombre: string }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FASE_LABELS: Record<string, string> = {
  pre_proyecto:  'Contacto',
  propuesta:     'Propuesta enviada',
  negociacion:   'Negociación',
  adjudicado:    'Adjudicado',
  en_pausa:      'En pausa',
  ejecucion:     'Ejecución',
  cierre:        'Cierre',
  cerrado:       'Cerrado',
  cancelado:     'Cancelado',
}

const FASE_COLORS: Record<string, { bg: string; color: string }> = {
  pre_proyecto: { bg: '#f4f6f8', color: '#6b7280' },
  propuesta:    { bg: '#e0f2fe', color: '#0c6a8c' },
  negociacion:  { bg: '#fef3c7', color: '#854f0b' },
  adjudicado:   { bg: '#dcfce7', color: '#3b6d11' },
  en_pausa:     { bg: '#f4f6f8', color: '#9ca3af' },
  ejecucion:    { bg: '#eff6ff', color: '#004aad' },
  cierre:       { bg: '#faf5ff', color: '#7c3aed' },
  cerrado:      { bg: '#f0fdf4', color: '#16a34a' },
  cancelado:    { bg: '#fef2f2', color: '#dc2626' },
}

const SECTORES = ['Minería', 'Construcción', 'Energía', 'Infraestructura', 'Industrial', 'Otro']

const TIPOS_ACTIVIDAD = [
  { value: 'nota',                label: 'Nota' },
  { value: 'llamada',             label: 'Llamada' },
  { value: 'reunion',             label: 'Reunión' },
  { value: 'documento_recibido',  label: 'Documento recibido' },
  { value: 'documento_enviado',   label: 'Documento enviado' },
  { value: 'propuesta_enviada',   label: 'Propuesta enviada' },
  { value: 'observacion_cliente', label: 'Observación del cliente' },
]

const TIPO_ICON: Record<string, React.ReactNode> = {
  nota:                <IconNote size={14} />,
  llamada:             <IconPhone size={14} />,
  reunion:             <IconUsers size={14} />,
  documento_recibido:  <IconFileImport size={14} />,
  documento_enviado:   <IconFileExport size={14} />,
  cambio_fase:         <IconArrowRight size={14} />,
  propuesta_enviada:   <IconSend size={14} />,
  observacion_cliente: <IconMessage size={14} />,
}

const TIPO_COLOR: Record<string, string> = {
  nota:                '#6b7280',
  llamada:             '#0c6a8c',
  reunion:             '#854f0b',
  documento_recibido:  '#3b6d11',
  documento_enviado:   '#004aad',
  cambio_fase:         '#7c3aed',
  propuesta_enviada:   '#0c6a8c',
  observacion_cliente: '#dc2626',
}

function formatMonto(n: number) {
  return n > 0
    ? n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 })
    : 'Por definir'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── OportunidadView ─────────────────────────────────────────────────────────

export default function OportunidadView({
  proyecto,
  actividadesIniciales,
  documentosIniciales,
}: {
  proyecto: Proyecto
  actividadesIniciales: Actividad[]
  documentosIniciales: Documento[]
}) {
  const router = useRouter()

  // Fase y campos editables
  const [fase, setFase] = useState(proyecto.fase)
  const [monto, setMonto] = useState(proyecto.monto_contrato)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    nombre:         proyecto.nombre,
    sector:         proyecto.sector,
    monto_contrato: proyecto.monto_contrato > 0 ? String(proyecto.monto_contrato) : '',
  })
  const [nombre, setNombre] = useState(proyecto.nombre)
  const [sector, setSector] = useState(proyecto.sector)

  // Actividades
  const [actividades, setActividades] = useState<Actividad[]>(actividadesIniciales)
  const [actTipo, setActTipo] = useState('nota')
  const [actDesc, setActDesc] = useState('')
  const [addingAct, setAddingAct] = useState(false)

  // Transiciones de fase
  const [loadingFase, setLoadingFase] = useState(false)
  const [showPerdido, setShowPerdido] = useState(false)
  const [motivoPerdida, setMotivoPerdida] = useState('')
  const [showMontoEjecucion, setShowMontoEjecucion] = useState(false)
  const [montoEjecucion, setMontoEjecucion] = useState('')

  // UI
  const [savingEdit, setSavingEdit] = useState(false)
  const [tab, setTab] = useState<'cliente' | 'interno'>('cliente')
  const [error, setError] = useState('')

  // ── Helpers ──────────────────────────────────────────────────────────────

  async function registrarActividad(tipo: string, descripcion: string): Promise<Actividad | null> {
    const res = await fetch(`/api/proyectos/${proyecto.id}/actividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, descripcion }),
    })
    return res.ok ? res.json() : null
  }

  async function handleFaseTransition(nuevaFase: string, extraMonto?: number) {
    setLoadingFase(true)
    setError('')
    try {
      const res = await fetch(`/api/pipeline/${proyecto.id}/fase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fase: nuevaFase,
          ...(extraMonto !== undefined ? { monto_contrato: extraMonto } : {}),
        }),
      })
      if (!res.ok) { setError('Error al cambiar fase'); return }

      const act = await registrarActividad(
        'cambio_fase',
        `Cambio de fase: ${FASE_LABELS[fase] ?? fase} → ${FASE_LABELS[nuevaFase] ?? nuevaFase}`
      )
      if (act) setActividades((prev) => [...prev, act])

      setFase(nuevaFase)
      if (extraMonto !== undefined) setMonto(extraMonto)
      if (nuevaFase === 'ejecucion') router.push('/dashboard/proyectos')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoadingFase(false)
    }
  }

  async function handlePerdido() {
    if (!motivoPerdida.trim()) return
    setLoadingFase(true)
    setError('')
    try {
      const nota = await registrarActividad('nota', `Motivo de pérdida: ${motivoPerdida}`)

      const res = await fetch(`/api/pipeline/${proyecto.id}/fase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fase: 'cancelado' }),
      })
      if (!res.ok) { setError('Error al cambiar fase'); return }

      const act = await registrarActividad(
        'cambio_fase',
        `Cambio de fase: ${FASE_LABELS[fase] ?? fase} → Cancelado`
      )

      const nuevas: Actividad[] = []
      if (nota) nuevas.push(nota)
      if (act)  nuevas.push(act)
      setActividades((prev) => [...prev, ...nuevas])
      setFase('cancelado')
      setShowPerdido(false)
      setMotivoPerdida('')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoadingFase(false)
    }
  }

  async function handleAddActividad() {
    if (!actDesc.trim()) return
    setAddingAct(true)
    try {
      const act = await registrarActividad(actTipo, actDesc.trim())
      if (act) {
        setActividades((prev) => [...prev, act])
        setActDesc('')
        setActTipo('nota')
      }
    } finally {
      setAddingAct(false)
    }
  }

  async function handleSaveEdit() {
    setSavingEdit(true)
    setError('')
    try {
      const nuevoMonto = editForm.monto_contrato ? parseFloat(editForm.monto_contrato) : 0
      const body: Record<string, unknown> = {}
      if (editForm.nombre !== nombre)   body.nombre = editForm.nombre
      if (editForm.sector !== sector)   body.sector = editForm.sector
      if (nuevoMonto !== monto)         body.monto_contrato = nuevoMonto

      if (Object.keys(body).length > 0) {
        const res = await fetch(`/api/proyectos/${proyecto.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) { setError('Error al guardar cambios'); return }
      }

      if (editForm.nombre) setNombre(editForm.nombre)
      if (editForm.sector) setSector(editForm.sector)
      setMonto(nuevoMonto)
      setIsEditing(false)
    } catch {
      setError('Error de conexión')
    } finally {
      setSavingEdit(false)
    }
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: 13,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none',
    color: '#1a1d1e', backgroundColor: '#ffffff', boxSizing: 'border-box',
  }

  const faseBadge = FASE_COLORS[fase] ?? FASE_COLORS.pre_proyecto

  // ── Transition buttons ───────────────────────────────────────────────────

  function TransitionButtons() {
    const btnBase: React.CSSProperties = {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontSize: 12, fontWeight: 500, border: 'none', borderRadius: 6,
      padding: '7px 12px', cursor: loadingFase ? 'not-allowed' : 'pointer',
      opacity: loadingFase ? 0.6 : 1, width: '100%',
    }

    if (fase === 'cancelado' || fase === 'ejecucion' || fase === 'cierre' || fase === 'cerrado') {
      return null
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {fase === 'pre_proyecto' && (
          <button
            onClick={() => handleFaseTransition('propuesta')}
            disabled={loadingFase}
            style={{ ...btnBase, backgroundColor: '#eff6ff', color: '#004aad' }}
          >
            <IconSend size={14} />
            Marcar propuesta enviada
          </button>
        )}

        {fase === 'propuesta' && (
          <button
            onClick={() => handleFaseTransition('negociacion')}
            disabled={loadingFase}
            style={{ ...btnBase, backgroundColor: '#fef3c7', color: '#854f0b' }}
          >
            <IconArrowRight size={14} />
            Iniciar negociación
          </button>
        )}

        {fase === 'negociacion' && (
          <>
            <button
              onClick={() => handleFaseTransition('adjudicado')}
              disabled={loadingFase}
              style={{ ...btnBase, backgroundColor: '#dcfce7', color: '#3b6d11' }}
            >
              <IconCheck size={14} />
              Marcar como adjudicado
            </button>
            <button
              onClick={() => handleFaseTransition('en_pausa')}
              disabled={loadingFase}
              style={{ ...btnBase, backgroundColor: '#f4f6f8', color: '#6b7280' }}
            >
              <IconPlayerPause size={14} />
              Pausar
            </button>
            {!showPerdido ? (
              <button
                onClick={() => setShowPerdido(true)}
                disabled={loadingFase}
                style={{ ...btnBase, backgroundColor: '#fef2f2', color: '#dc2626' }}
              >
                <IconAlertTriangle size={14} />
                Marcar como perdido
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, backgroundColor: '#fef2f2', borderRadius: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#dc2626' }}>Motivo de pérdida</span>
                <input
                  autoFocus
                  value={motivoPerdida}
                  onChange={(e) => setMotivoPerdida(e.target.value)}
                  placeholder="Describe el motivo..."
                  style={{ ...inputStyle, borderColor: '#fca5a5' }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={handlePerdido}
                    disabled={!motivoPerdida.trim() || loadingFase}
                    style={{ ...btnBase, flex: 1, backgroundColor: '#dc2626', color: '#ffffff', opacity: !motivoPerdida.trim() || loadingFase ? 0.5 : 1 }}
                  >
                    Confirmar pérdida
                  </button>
                  <button
                    onClick={() => { setShowPerdido(false); setMotivoPerdida('') }}
                    style={{ padding: '7px 10px', fontSize: 12, color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {fase === 'en_pausa' && (
          <button
            onClick={() => handleFaseTransition('negociacion')}
            disabled={loadingFase}
            style={{ ...btnBase, backgroundColor: '#dcfce7', color: '#3b6d11' }}
          >
            <IconPlayerPlay size={14} />
            Reactivar negociación
          </button>
        )}

        {fase === 'adjudicado' && (
          !showMontoEjecucion ? (
            <button
              onClick={() => {
                if (monto > 0) handleFaseTransition('ejecucion')
                else setShowMontoEjecucion(true)
              }}
              disabled={loadingFase}
              style={{ ...btnBase, backgroundColor: '#004aad', color: '#ffffff' }}
            >
              <IconRocket size={14} />
              Convertir a proyecto
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, backgroundColor: '#eff6ff', borderRadius: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#004aad' }}>Ingresa el monto del contrato</span>
              <input
                type="number"
                min="0"
                step="0.01"
                autoFocus
                value={montoEjecucion}
                onChange={(e) => setMontoEjecucion(e.target.value)}
                placeholder="Monto (S/)"
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => {
                    const m = parseFloat(montoEjecucion)
                    if (m > 0) {
                      handleFaseTransition('ejecucion', m)
                      setShowMontoEjecucion(false)
                    }
                  }}
                  disabled={!montoEjecucion || parseFloat(montoEjecucion) <= 0 || loadingFase}
                  style={{ ...btnBase, flex: 1, backgroundColor: '#004aad', color: '#ffffff', opacity: !montoEjecucion || parseFloat(montoEjecucion) <= 0 ? 0.5 : 1 }}
                >
                  <IconRocket size={14} />
                  Confirmar
                </button>
                <button
                  onClick={() => { setShowMontoEjecucion(false); setMontoEjecucion('') }}
                  style={{ padding: '7px 10px', fontSize: 12, color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )
        )}
      </div>
    )
  }

  // ── Documentos ───────────────────────────────────────────────────────────

  const docsCliente = documentosIniciales.filter((d) => !d.es_interno)
  const docsInternos = documentosIniciales.filter((d) => d.es_interno)
  const docsActivos = tab === 'cliente' ? docsCliente : docsInternos

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>

      {/* Back + Header */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href="/dashboard/pipeline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#9ca3af', textDecoration: 'none', marginBottom: 10 }}
        >
          <IconArrowLeft size={14} />
          Volver al pipeline
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#b0b7c3' }}>{proyecto.codigo}</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 999,
            backgroundColor: faseBadge.bg, color: faseBadge.color,
          }}>
            {FASE_LABELS[fase] ?? fase}
          </span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1a1d1e', margin: '4px 0 0' }}>
          {nombre}
        </h1>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12, padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: 6 }}>
          {error}
        </p>
      )}

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 16, alignItems: 'start' }}>

        {/* ── Left Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Info card */}
          <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1d1e' }}>Información</span>
              {!isEditing ? (
                <button
                  onClick={() => { setIsEditing(true); setEditForm({ nombre, sector, monto_contrato: monto > 0 ? String(monto) : '' }) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <IconPencil size={13} />
                  Editar
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#3b6d11', background: 'none', border: 'none', cursor: 'pointer', opacity: savingEdit ? 0.6 : 1 }}
                  >
                    <IconCheck size={13} />
                    {savingEdit ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <IconX size={13} />
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Nombre */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', display: 'block', marginBottom: 3 }}>NOMBRE</span>
                {isEditing ? (
                  <input
                    value={editForm.nombre}
                    onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                    style={inputStyle}
                  />
                ) : (
                  <span style={{ fontSize: 13, color: '#1a1d1e' }}>{nombre}</span>
                )}
              </div>

              {/* Cliente */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', display: 'block', marginBottom: 3 }}>CLIENTE</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e', display: 'block' }}>{proyecto.cliente.razon_social}</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>RUC {proyecto.cliente.ruc}</span>
              </div>

              {/* Contactos */}
              {proyecto.cliente.contactos.length > 0 && (
                <div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', display: 'block', marginBottom: 6 }}>
                    CONTACTO{proyecto.cliente.contactos.length > 1 ? 'S' : ''}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {proyecto.cliente.contactos.map((c) => (
                      <div key={c.id} style={{ padding: '8px 10px', backgroundColor: '#f9fafb', borderRadius: 7 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e' }}>{c.nombre}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{c.cargo}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{c.email} · {c.telefono}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sector */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', display: 'block', marginBottom: 3 }}>SECTOR</span>
                {isEditing ? (
                  <select
                    value={editForm.sector}
                    onChange={(e) => setEditForm((p) => ({ ...p, sector: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <span style={{ fontSize: 13, color: '#1a1d1e' }}>{sector}</span>
                )}
              </div>

              {/* Monto */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', display: 'block', marginBottom: 3 }}>MONTO ESTIMADO</span>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.monto_contrato}
                    onChange={(e) => setEditForm((p) => ({ ...p, monto_contrato: e.target.value }))}
                    placeholder="Se definirá al adjudicar"
                    style={inputStyle}
                  />
                ) : (
                  <span style={{ fontSize: 13, color: monto > 0 ? '#1a1d1e' : '#9ca3af' }}>{formatMonto(monto)}</span>
                )}
              </div>

              {/* Fecha */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', display: 'block', marginBottom: 3 }}>REGISTRADO</span>
                <span style={{ fontSize: 13, color: '#1a1d1e' }}>{formatDate(proyecto.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Fase transitions card */}
          <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 18 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1d1e', display: 'block', marginBottom: 4 }}>Fase actual</span>
            <span style={{
              display: 'inline-block', fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 999,
              backgroundColor: faseBadge.bg, color: faseBadge.color,
            }}>
              {FASE_LABELS[fase] ?? fase}
            </span>
            <TransitionButtons />
          </div>
        </div>

        {/* ── Right Panel — Timeline ── */}
        <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1d1e', display: 'block', marginBottom: 14 }}>Actividad</span>

          {/* Quick add */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={actTipo}
                onChange={(e) => setActTipo(e.target.value)}
                style={{ ...inputStyle, width: 'auto', flexShrink: 0, cursor: 'pointer' }}
              >
                {TIPOS_ACTIVIDAD.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={actDesc}
                onChange={(e) => setActDesc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddActividad()}
                placeholder="Describe la actividad..."
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={handleAddActividad}
                disabled={!actDesc.trim() || addingAct}
                style={{
                  padding: '7px 14px', fontSize: 12, fontWeight: 500,
                  color: '#ffffff', backgroundColor: '#004aad',
                  border: 'none', borderRadius: 6,
                  cursor: !actDesc.trim() || addingAct ? 'not-allowed' : 'pointer',
                  opacity: !actDesc.trim() || addingAct ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                {addingAct ? '...' : 'Agregar'}
              </button>
            </div>
          </div>

          {/* Timeline */}
          {actividades.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
              Sin actividades registradas aún.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[...actividades].reverse().map((a, i) => {
                const color = TIPO_COLOR[a.tipo] ?? '#6b7280'
                return (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex', gap: 12,
                      paddingBottom: i < actividades.length - 1 ? 14 : 0,
                    }}
                  >
                    {/* Icon col */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: `${color}18`, color,
                      }}>
                        {TIPO_ICON[a.tipo] ?? <IconNote size={14} />}
                      </div>
                      {i < actividades.length - 1 && (
                        <div style={{ width: 1, flex: 1, backgroundColor: '#f4f6f8', marginTop: 4 }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, paddingTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color, backgroundColor: `${color}12`, padding: '1px 6px', borderRadius: 999 }}>
                          {TIPOS_ACTIVIDAD.find((t) => t.value === a.tipo)?.label ?? a.tipo}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: '#1a1d1e', margin: '0 0 4px', lineHeight: 1.4 }}>
                        {a.descripcion}
                      </p>
                      <span style={{ fontSize: 11, color: '#b0b7c3' }}>
                        {a.usuario.nombre} · {formatDateTime(a.created_at)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Documentos ── */}
      <div style={{ marginTop: 16, backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1d1e' }}>Documentos</span>
          <Link
            href={`/dashboard/proyectos/${proyecto.id}/documentos/nuevo`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 500, color: '#004aad',
              padding: '5px 12px', borderRadius: 6,
              border: '0.5px solid #004aad', textDecoration: 'none',
            }}
          >
            Subir documento
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 14, borderBottom: '1px solid #f4f6f8' }}>
          {(['cliente', 'interno'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 14px', fontSize: 12, fontWeight: 500,
                color: tab === t ? '#004aad' : '#9ca3af',
                background: 'none', border: 'none',
                borderBottom: tab === t ? '2px solid #004aad' : '2px solid transparent',
                cursor: 'pointer', marginBottom: -1,
              }}
            >
              {t === 'cliente' ? `Del cliente (${docsCliente.length})` : `Nuestros (${docsInternos.length})`}
            </button>
          ))}
        </div>

        {docsActivos.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
            Sin documentos en esta categoría.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {docsActivos.map((doc, i) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0',
                  borderBottom: i < docsActivos.length - 1 ? '0.5px solid #f4f6f8' : 'none',
                }}
              >
                <div style={{ color: '#9ca3af', flexShrink: 0 }}>
                  <IconFileText size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.nombre}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    {doc.tipo} · {doc.version} · {doc.subido.nombre} · {formatDate(doc.fecha_subida)}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#6b7280', backgroundColor: '#f4f6f8', padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>
                  {doc.estado.replace(/_/g, ' ')}
                </span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#004aad', textDecoration: 'none', flexShrink: 0 }}
                >
                  Ver
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
