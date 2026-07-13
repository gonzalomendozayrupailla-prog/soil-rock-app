'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  IconArrowLeft, IconPencil, IconCheck, IconX,
  IconNote, IconPhone, IconUsers, IconFileImport,
  IconFileExport, IconArrowRight, IconSend, IconMessage,
  IconRocket, IconPlayerPause, IconPlayerPlay,
  IconAlertTriangle, IconFileText, IconDownload, IconTrash,
} from '@tabler/icons-react'
import TabTareas from '@/app/components/TabTareas'
import TabCampo from '@/app/components/TabCampo'
import TabValorizaciones from '@/app/components/TabValorizaciones'
import TabFacturacion from '@/app/components/TabFacturacion'

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
  fase_subida?: string | null
  subido: { nombre: string }
}
interface UsuarioSimple { id: string; nombre: string }
interface ValorizacionSimple { id: string; numero: number }

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
  propuesta:    { bg: '#faeeda', color: '#854f0b' },
  negociacion:  { bg: '#faeeda', color: '#854f0b' },
  adjudicado:   { bg: '#eaf3de', color: '#3b6d11' },
  en_pausa:     { bg: '#f4f6f8', color: '#6b7280' },
  ejecucion:    { bg: '#e8f0fd', color: '#004aad' },
  cierre:       { bg: '#f4f6f8', color: '#6b7280' },
  cerrado:      { bg: '#f4f6f8', color: '#6b7280' },
  cancelado:    { bg: '#fcebeb', color: '#a32d2d' },
}

const ESTADO_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  borrador:           { backgroundColor: '#f4f6f8', color: '#6b7280' },
  enviado_cliente:    { backgroundColor: '#e0f4fc', color: '#0c6a8c' },
  con_observaciones:  { backgroundColor: '#faeeda', color: '#854f0b' },
  aprobado:           { backgroundColor: '#eaf3de', color: '#3b6d11' },
  pendiente_revision: { backgroundColor: '#faeeda', color: '#854f0b' },
  revisado:           { backgroundColor: '#eaf3de', color: '#3b6d11' },
}

// Fases que pertenecen al pipeline (kanban) — para back button y doc link
const PIPELINE_FASES = new Set(['pre_proyecto', 'propuesta', 'negociacion', 'adjudicado', 'en_pausa'])
// Fases que muestran tabs operativas (Campo, Valorizaciones, Facturación)
const FASES_CON_TABS_OP = new Set(['adjudicado', 'ejecucion', 'cierre', 'cerrado', 'cancelado'])

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

// ─── ProyectoView ─────────────────────────────────────────────────────────────

export default function ProyectoView({
  proyecto,
  actividadesIniciales,
  documentosIniciales,
  usuarios,
  valorizacionesIniciales,
}: {
  proyecto: Proyecto
  actividadesIniciales: Actividad[]
  documentosIniciales: Documento[]
  usuarios: UsuarioSimple[]
  valorizacionesIniciales: ValorizacionSimple[]
}) {
  const router = useRouter()

  // ── State ─────────────────────────────────────────────────────────────────
  const [fase, setFase] = useState(proyecto.fase)
  const [monto, setMonto] = useState(proyecto.monto_contrato)
  const [nombre, setNombre] = useState(proyecto.nombre)
  const [sector, setSector] = useState(proyecto.sector)

  const [avance, setAvance] = useState(proyecto.avance_general)
  const [avanceDraft, setAvanceDraft] = useState(proyecto.avance_general)
  const [savingAvance, setSavingAvance] = useState(false)
  const [avanceSaved, setAvanceSaved] = useState(false)
  const [fechaInicio, setFechaInicio] = useState(proyecto.fecha_inicio)
  const [fechaCierre, setFechaCierre] = useState(proyecto.fecha_cierre_estimada)

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    nombre: proyecto.nombre,
    sector: proyecto.sector,
    monto_contrato: proyecto.monto_contrato > 0 ? String(proyecto.monto_contrato) : '',
    fecha_inicio: proyecto.fecha_inicio.slice(0, 10),
    fecha_cierre_estimada: proyecto.fecha_cierre_estimada.slice(0, 10),
  })
  const [savingEdit, setSavingEdit] = useState(false)

  const [actividades, setActividades] = useState<Actividad[]>(actividadesIniciales)
  const [actTipo, setActTipo] = useState('nota')
  const [actDesc, setActDesc] = useState('')
  const [addingAct, setAddingAct] = useState(false)

  const [loadingFase, setLoadingFase] = useState(false)
  const [showPerdido, setShowPerdido] = useState(false)
  const [motivoPerdida, setMotivoPerdida] = useState('')
  const [showCancelarProyecto, setShowCancelarProyecto] = useState(false)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [showMontoEjecucion, setShowMontoEjecucion] = useState(false)
  const [montoEjecucion, setMontoEjecucion] = useState('')

  const [documentos, setDocumentos] = useState(documentosIniciales)
  const [changingDocId, setChangingDocId] = useState<string | null>(null)
  const [savingDocId, setSavingDocId] = useState<string | null>(null)
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null)
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState('info')
  const [docSubTab, setDocSubTab] = useState<'cliente' | 'interno'>('cliente')
  const [error, setError] = useState('')

  // ── Computed ──────────────────────────────────────────────────────────────
  const esPipelineFase = PIPELINE_FASES.has(fase)
  const backHref  = PIPELINE_FASES.has(proyecto.fase) ? '/dashboard/pipeline' : '/dashboard/proyectos'
  const backLabel = PIPELINE_FASES.has(proyecto.fase) ? 'Volver al pipeline' : 'Volver a proyectos'
  const faseBadge = FASE_COLORS[fase] ?? FASE_COLORS.pre_proyecto

  const docsCliente  = documentos.filter((d) => !d.es_interno)
  const docsInternos = documentos.filter((d) => d.es_interno)
  const docsActivos  = docSubTab === 'cliente' ? docsCliente : docsInternos

  const tabs = [
    { key: 'info',        label: 'Info' },
    { key: 'tareas',      label: 'Tareas' },
    { key: 'documentos',  label: 'Documentos' },
    { key: 'actividad',   label: 'Actividad' },
    ...(FASES_CON_TABS_OP.has(fase) ? [
      { key: 'campo',          label: 'Campo' },
      { key: 'valorizaciones', label: 'Valorizaciones' },
      { key: 'facturación',    label: 'Facturación' },
    ] : []),
  ]

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: 13,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none',
    color: '#1a1d1e', backgroundColor: '#ffffff', boxSizing: 'border-box',
  }

  const fieldLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 500, color: '#9ca3af',
    display: 'block', marginBottom: 3, textTransform: 'uppercase',
    letterSpacing: '0.04em',
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
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
      router.refresh()
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
      const act = await registrarActividad('cambio_fase', `Cambio de fase: ${FASE_LABELS[fase] ?? fase} → Cancelado`)
      const nuevas: Actividad[] = []
      if (nota) nuevas.push(nota)
      if (act)  nuevas.push(act)
      setActividades((prev) => [...prev, ...nuevas])
      setFase('cancelado')
      router.refresh()
      setShowPerdido(false)
      setMotivoPerdida('')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoadingFase(false)
    }
  }

  async function handleCancelarProyecto() {
    if (!motivoCancelacion.trim()) return
    setLoadingFase(true)
    setError('')
    try {
      const nota = await registrarActividad('nota', `Motivo de cancelación: ${motivoCancelacion}`)
      const res = await fetch(`/api/pipeline/${proyecto.id}/fase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fase: 'cancelado' }),
      })
      if (!res.ok) { setError('Error al cancelar proyecto'); return }
      const act = await registrarActividad('cambio_fase', `Cambio de fase: ${FASE_LABELS[fase] ?? fase} → Cancelado`)
      const nuevas: Actividad[] = []
      if (nota) nuevas.push(nota)
      if (act)  nuevas.push(act)
      setActividades((prev) => [...prev, ...nuevas])
      setFase('cancelado')
      router.refresh()
      setShowCancelarProyecto(false)
      setMotivoCancelacion('')
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

  async function handleDeleteDoc(docId: string) {
    setDeletingDocId(docId)
    setConfirmDeleteDocId(null)
    try {
      const res = await fetch(`/api/documentos/${docId}`, { method: 'DELETE' })
      if (res.ok) {
        setDocumentos((prev) => prev.filter((d) => d.id !== docId))
      }
    } finally {
      setDeletingDocId(null)
    }
  }

  async function handleEstadoChange(docId: string, nuevoEstado: string) {
    const docPrev = documentos.find((d) => d.id === docId)
    if (!docPrev || docPrev.estado === nuevoEstado) {
      setChangingDocId(null)
      return
    }
    setSavingDocId(docId)
    setChangingDocId(null)
    try {
      const res = await fetch(`/api/documentos/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (res.ok) {
        setDocumentos((prev) =>
          prev.map((d) => d.id === docId ? { ...d, estado: nuevoEstado } : d)
        )
      }
    } finally {
      setSavingDocId(null)
    }
  }

  async function handleSaveAvance() {
    const valor = Math.min(100, Math.max(0, avanceDraft))
    setSavingAvance(true)
    setAvanceSaved(false)
    try {
      const res = await fetch(`/api/proyectos/${proyecto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avance_general: valor }),
      })
      if (!res.ok) { setError('Error al guardar avance'); return }
      setAvance(valor)
      setAvanceDraft(valor)
      setAvanceSaved(true)
      setTimeout(() => setAvanceSaved(false), 2500)
    } catch {
      setError('Error de conexión')
    } finally {
      setSavingAvance(false)
    }
  }

  async function handleSaveEdit() {
    setSavingEdit(true)
    setError('')
    try {
      const nuevoMonto = editForm.monto_contrato ? parseFloat(editForm.monto_contrato) : 0
      const body: Record<string, unknown> = {}
      if (editForm.nombre !== nombre)                         body.nombre = editForm.nombre
      if (editForm.sector !== sector)                         body.sector = editForm.sector
      if (nuevoMonto !== monto)                               body.monto_contrato = nuevoMonto
      if (editForm.fecha_inicio !== fechaInicio.slice(0, 10)) body.fecha_inicio = editForm.fecha_inicio
      if (editForm.fecha_cierre_estimada !== fechaCierre.slice(0, 10)) body.fecha_cierre_estimada = editForm.fecha_cierre_estimada

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
      setFechaInicio(editForm.fecha_inicio)
      setFechaCierre(editForm.fecha_cierre_estimada)
      setIsEditing(false)
    } catch {
      setError('Error de conexión')
    } finally {
      setSavingEdit(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>

      {/* ── Back + Header ── */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href={backHref}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#9ca3af', textDecoration: 'none', marginBottom: 10 }}
        >
          <IconArrowLeft size={14} />
          {backLabel}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#b0b7c3' }}>{proyecto.codigo}</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 999,
            backgroundColor: faseBadge.bg, color: faseBadge.color,
          }}>
            {FASE_LABELS[fase] ?? fase}
          </span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1a1d1e', margin: '0 0 2px' }}>{nombre}</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{proyecto.cliente.razon_social}</p>

        {/* ── Action Buttons ── */}
        {fase !== 'cancelado' && fase !== 'cerrado' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>

            {fase === 'pre_proyecto' && (
              <ActionBtn
                onClick={() => handleFaseTransition('propuesta')}
                disabled={loadingFase}
                bg="#e8f0fd" color="#004aad"
                icon={<IconSend size={13} />}
                label="Marcar propuesta enviada"
              />
            )}

            {fase === 'propuesta' && (<>
              <ActionBtn
                onClick={() => handleFaseTransition('negociacion')}
                disabled={loadingFase}
                bg="#faeeda" color="#854f0b"
                icon={<IconArrowRight size={13} />}
                label="Iniciar negociación"
              />
              <BackBtn onClick={() => handleFaseTransition('pre_proyecto')} disabled={loadingFase} label="← Volver a Contacto" />
            </>)}

            {fase === 'negociacion' && (<>
              <ActionBtn
                onClick={() => handleFaseTransition('adjudicado')}
                disabled={loadingFase}
                bg="#eaf3de" color="#3b6d11"
                icon={<IconCheck size={13} />}
                label="Adjudicar"
              />
              <ActionBtn
                onClick={() => handleFaseTransition('en_pausa')}
                disabled={loadingFase}
                bg="#f4f6f8" color="#6b7280"
                icon={<IconPlayerPause size={13} />}
                label="Pausar"
              />
              <BackBtn onClick={() => handleFaseTransition('propuesta')} disabled={loadingFase} label="← Volver a Propuesta enviada" />
              {!showPerdido ? (
                <ActionBtn
                  onClick={() => setShowPerdido(true)}
                  disabled={loadingFase}
                  bg="#fcebeb" color="#a32d2d"
                  icon={<IconAlertTriangle size={13} />}
                  label="Marcar como perdido"
                />
              ) : (
                <MotivoInline
                  bg="#fcebeb"
                  color="#a32d2d"
                  placeholder="Motivo de pérdida..."
                  value={motivoPerdida}
                  onChange={setMotivoPerdida}
                  onConfirm={handlePerdido}
                  onCancel={() => { setShowPerdido(false); setMotivoPerdida('') }}
                  disabled={!motivoPerdida.trim() || loadingFase}
                />
              )}
            </>)}

            {fase === 'en_pausa' && (
              <ActionBtn
                onClick={() => handleFaseTransition('negociacion')}
                disabled={loadingFase}
                bg="#eaf3de" color="#3b6d11"
                icon={<IconPlayerPlay size={13} />}
                label="Reactivar"
              />
            )}

            {fase === 'adjudicado' && (<>
              {!showMontoEjecucion ? (
                <ActionBtn
                  onClick={() => { if (monto > 0) handleFaseTransition('ejecucion'); else setShowMontoEjecucion(true) }}
                  disabled={loadingFase}
                  bg="#004aad" color="#ffffff"
                  icon={<IconRocket size={13} />}
                  label="Iniciar ejecución"
                />
              ) : (
                <MontoInline
                  value={montoEjecucion}
                  onChange={setMontoEjecucion}
                  onConfirm={() => {
                    const m = parseFloat(montoEjecucion)
                    if (m > 0) { handleFaseTransition('ejecucion', m); setShowMontoEjecucion(false) }
                  }}
                  onCancel={() => { setShowMontoEjecucion(false); setMontoEjecucion('') }}
                  disabled={!montoEjecucion || parseFloat(montoEjecucion) <= 0 || loadingFase}
                />
              )}
              <BackBtn onClick={() => handleFaseTransition('negociacion')} disabled={loadingFase} label="← Volver a Negociación" />
            </>)}

            {fase === 'ejecucion' && (<>
              <ActionBtn
                onClick={() => handleFaseTransition('cierre')}
                disabled={loadingFase}
                bg="#f4f6f8" color="#6b7280"
                icon={<IconArrowRight size={13} />}
                label="Iniciar cierre"
              />
              {!showCancelarProyecto ? (
                <ActionBtn
                  onClick={() => setShowCancelarProyecto(true)}
                  disabled={loadingFase}
                  bg="#fcebeb" color="#a32d2d"
                  icon={<IconX size={13} />}
                  label="Cancelar proyecto"
                />
              ) : (
                <MotivoInline
                  bg="#fcebeb"
                  color="#a32d2d"
                  placeholder="Motivo de cancelación..."
                  value={motivoCancelacion}
                  onChange={setMotivoCancelacion}
                  onConfirm={handleCancelarProyecto}
                  onCancel={() => { setShowCancelarProyecto(false); setMotivoCancelacion('') }}
                  disabled={!motivoCancelacion.trim() || loadingFase}
                />
              )}
            </>)}

            {fase === 'cierre' && (<>
              <ActionBtn
                onClick={() => handleFaseTransition('cerrado')}
                disabled={loadingFase}
                bg="#eaf3de" color="#3b6d11"
                icon={<IconCheck size={13} />}
                label="Cerrar proyecto"
              />
              <BackBtn onClick={() => handleFaseTransition('ejecucion')} disabled={loadingFase} label="← Volver a Ejecución" />
            </>)}
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12, padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: 6 }}>
          {error}
        </p>
      )}

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e8eaed', marginBottom: 20 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '9px 16px', fontSize: 13,
              fontWeight: activeTab === t.key ? 500 : 400,
              color: activeTab === t.key ? '#004aad' : '#6b7280',
              background: 'none', border: 'none',
              borderBottom: activeTab === t.key ? '2px solid #004aad' : '2px solid transparent',
              cursor: 'pointer', marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Info ── */}
      {activeTab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* Datos del proyecto */}
          <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>Datos del proyecto</span>
              {!isEditing ? (
                <button
                  onClick={() => { setIsEditing(true); setEditForm({ nombre, sector, monto_contrato: monto > 0 ? String(monto) : '', fecha_inicio: fechaInicio.slice(0, 10), fecha_cierre_estimada: fechaCierre.slice(0, 10) }) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <IconPencil size={13} /> Editar
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#3b6d11', background: 'none', border: 'none', cursor: 'pointer', opacity: savingEdit ? 0.6 : 1 }}
                  >
                    <IconCheck size={13} /> {savingEdit ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <IconX size={13} /> Cancelar
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <span style={fieldLabel}>Nombre</span>
                {isEditing
                  ? <input value={editForm.nombre} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} style={inputStyle} />
                  : <span style={{ fontSize: 13, color: '#1a1d1e' }}>{nombre}</span>
                }
              </div>

              <div>
                <span style={fieldLabel}>Sector</span>
                {isEditing
                  ? (
                    <select value={editForm.sector} onChange={(e) => setEditForm((p) => ({ ...p, sector: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                      {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )
                  : <span style={{ fontSize: 13, color: '#1a1d1e' }}>{sector}</span>
                }
              </div>

              <div>
                <span style={fieldLabel}>Monto estimado</span>
                {isEditing
                  ? <input type="number" min="0" step="0.01" value={editForm.monto_contrato} onChange={(e) => setEditForm((p) => ({ ...p, monto_contrato: e.target.value }))} placeholder="Se definirá al adjudicar" style={inputStyle} />
                  : <span style={{ fontSize: 13, color: monto > 0 ? '#1a1d1e' : '#9ca3af' }}>{formatMonto(monto)}</span>
                }
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <span style={fieldLabel}>Fecha inicio</span>
                  {isEditing
                    ? <input type="date" value={editForm.fecha_inicio} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio: e.target.value }))} style={inputStyle} />
                    : <span style={{ fontSize: 13, color: '#1a1d1e' }}>{formatDate(fechaInicio)}</span>
                  }
                </div>
                <div>
                  <span style={fieldLabel}>Cierre estimado</span>
                  {isEditing
                    ? <input type="date" value={editForm.fecha_cierre_estimada} onChange={(e) => setEditForm((p) => ({ ...p, fecha_cierre_estimada: e.target.value }))} style={inputStyle} />
                    : <span style={{ fontSize: 13, color: '#1a1d1e' }}>{formatDate(fechaCierre)}</span>
                  }
                </div>
              </div>

              <div>
                <span style={fieldLabel}>Avance general</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <input
                    type="range"
                    min={0} max={100} step={1}
                    value={avanceDraft}
                    onChange={(e) => { setAvanceDraft(Number(e.target.value)); setAvanceSaved(false) }}
                    style={{ flex: 1, accentColor: '#004aad', cursor: 'pointer' }}
                  />
                  <input
                    type="number"
                    min={0} max={100} step={1}
                    value={avanceDraft}
                    onChange={(e) => { setAvanceDraft(Math.min(100, Math.max(0, Number(e.target.value)))); setAvanceSaved(false) }}
                    style={{ ...inputStyle, width: 62, textAlign: 'center', padding: '4px 6px' }}
                  />
                  <span style={{ fontSize: 13, color: '#6b7280' }}>%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <div style={{ flex: 1, height: 4, backgroundColor: '#e8eaed', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${avanceDraft}%`, backgroundColor: '#004aad', borderRadius: 2, transition: 'width 0.1s' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <button
                    onClick={handleSaveAvance}
                    disabled={savingAvance || avanceDraft === avance}
                    style={{
                      fontSize: 12, fontWeight: 500,
                      color: '#ffffff', backgroundColor: avanceDraft === avance ? '#b0b7c3' : '#004aad',
                      border: 'none', borderRadius: 6,
                      padding: '5px 14px', cursor: (savingAvance || avanceDraft === avance) ? 'default' : 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {savingAvance ? 'Guardando...' : 'Guardar avance'}
                  </button>
                  {avanceSaved && (
                    <span style={{ fontSize: 12, color: '#3b6d11', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <IconCheck size={13} /> Guardado
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span style={fieldLabel}>Ing. Residente</span>
                <span style={{ fontSize: 13, color: '#1a1d1e' }}>{proyecto.ingeniero.nombre}</span>
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 18 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e', display: 'block', marginBottom: 16 }}>Cliente</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <span style={fieldLabel}>Razón social</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e' }}>{proyecto.cliente.razon_social}</span>
              </div>
              <div>
                <span style={fieldLabel}>RUC</span>
                <span style={{ fontSize: 13, color: '#1a1d1e', fontFamily: 'monospace' }}>{proyecto.cliente.ruc}</span>
              </div>
              <div>
                <span style={fieldLabel}>Sector</span>
                <span style={{ fontSize: 13, color: '#1a1d1e' }}>{proyecto.cliente.sector}</span>
              </div>

              {proyecto.cliente.contactos.length > 0 && (
                <div>
                  <span style={fieldLabel}>Contacto{proyecto.cliente.contactos.length > 1 ? 's' : ''}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    {proyecto.cliente.contactos.map((c) => (
                      <div key={c.id} style={{ padding: '9px 12px', backgroundColor: '#f9fafb', borderRadius: 8, border: '0.5px solid #f0f1f3' }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e' }}>{c.nombre}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{c.cargo}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{c.email}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{c.telefono}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {proyecto.cliente.contactos.length === 0 && (
                <p style={{ fontSize: 12, color: '#b0b7c3', margin: 0 }}>Sin contactos registrados</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Documentos ── */}
      {activeTab === 'documentos' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #e8eaed' }}>
              {(['cliente', 'interno'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDocSubTab(t)}
                  style={{
                    padding: '7px 16px', fontSize: 13, fontWeight: 500,
                    color: docSubTab === t ? '#004aad' : '#9ca3af',
                    background: 'none', border: 'none',
                    borderBottom: docSubTab === t ? '2px solid #004aad' : '2px solid transparent',
                    cursor: 'pointer', marginBottom: -1,
                  }}
                >
                  {t === 'cliente' ? `Del cliente (${docsCliente.length})` : `Nuestros (${docsInternos.length})`}
                </button>
              ))}
            </div>
            <Link
              href={`/dashboard/proyectos/${proyecto.id}/documentos/nuevo?from=${esPipelineFase ? 'pipeline' : 'proyectos'}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 500, color: '#004aad',
                padding: '6px 14px', borderRadius: 7,
                border: '0.5px solid #004aad', textDecoration: 'none',
              }}
            >
              Subir documento
            </Link>
          </div>

          {docsActivos.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px dashed #e8eaed', borderRadius: 10, padding: 48, textAlign: 'center' }}>
              <IconFileText size={28} style={{ color: '#d1d5db', margin: '0 auto 10px', display: 'block' }} />
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Sin documentos en esta categoría.</p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, overflow: 'hidden' }}>
              {docsActivos.map((doc, i) => {
                const estadoStyle = ESTADO_STYLES[doc.estado] ?? { backgroundColor: '#f4f6f8', color: '#6b7280' }
                const isSaving     = savingDocId === doc.id
                const isChanging   = changingDocId === doc.id
                const isDeleting   = deletingDocId === doc.id
                const confirmDelete = confirmDeleteDocId === doc.id
                const estadosValidos = doc.es_interno
                  ? ['borrador', 'enviado_cliente', 'con_observaciones', 'aprobado']
                  : ['pendiente_revision', 'revisado']
                const estadoLabels: Record<string, string> = {
                  borrador: 'Borrador',
                  enviado_cliente: 'Enviado al cliente',
                  con_observaciones: 'Con observaciones',
                  aprobado: 'Aprobado',
                  pendiente_revision: 'Pendiente revisión',
                  revisado: 'Revisado',
                }

                return (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      borderBottom: i < docsActivos.length - 1 ? '0.5px solid #e8eaed' : 'none',
                      opacity: isSaving || isDeleting ? 0.6 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#f4f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <IconFileText size={16} style={{ color: '#9ca3af' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.nombre}
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                        {doc.tipo} · v{doc.version} · {formatDate(doc.fecha_subida)} · {doc.subido.nombre}
                      </div>
                    </div>

                    {/* Badge de fase */}
                    {doc.fase_subida && (() => {
                      const fc = FASE_COLORS[doc.fase_subida] ?? { bg: '#f4f6f8', color: '#6b7280' }
                      return (
                        <span style={{
                          fontSize: 10, fontWeight: 500,
                          padding: '2px 7px', borderRadius: 999,
                          backgroundColor: fc.bg, color: fc.color,
                          flexShrink: 0, whiteSpace: 'nowrap',
                        }}>
                          {FASE_LABELS[doc.fase_subida] ?? doc.fase_subida}
                        </span>
                      )
                    })()}

                    {/* Estado: badge clickeable o select inline */}
                    {isChanging ? (
                      <select
                        autoFocus
                        defaultValue={doc.estado}
                        onChange={(e) => handleEstadoChange(doc.id, e.target.value)}
                        style={{
                          fontSize: 11, fontWeight: 500,
                          padding: '2px 6px', borderRadius: 999,
                          border: `1.5px solid ${estadoStyle.color}`,
                          backgroundColor: estadoStyle.backgroundColor,
                          color: estadoStyle.color,
                          cursor: 'pointer', outline: 'none',
                          flexShrink: 0,
                        }}
                      >
                        {estadosValidos.map((e) => (
                          <option key={e} value={e}>{estadoLabels[e] ?? e}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => !isSaving && setChangingDocId(doc.id)}
                        title="Clic para cambiar estado"
                        style={{
                          fontSize: 11, fontWeight: 500,
                          padding: '2px 8px', borderRadius: 999,
                          border: 'none', flexShrink: 0,
                          cursor: isSaving ? 'wait' : 'pointer',
                          ...estadoStyle,
                        }}
                      >
                        {isSaving ? '...' : (estadoLabels[doc.estado] ?? doc.estado.replace(/_/g, ' '))}
                      </button>
                    )}

                    <a
                      href={doc.url} target="_blank" rel="noopener noreferrer" title="Descargar"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, border: '0.5px solid #e8eaed', color: '#6b7280', flexShrink: 0, textDecoration: 'none' }}
                    >
                      <IconDownload size={14} />
                    </a>

                    {/* Eliminar */}
                    {confirmDelete ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          style={{ fontSize: 11, padding: '3px 8px', backgroundColor: '#a32d2d', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteDocId(null)}
                          style={{ fontSize: 11, padding: '3px 8px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 5, background: 'none', cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => !isDeleting && setConfirmDeleteDocId(doc.id)}
                        title="Eliminar documento"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, border: '0.5px solid #e8eaed', color: '#9ca3af', background: 'none', cursor: isDeleting ? 'wait' : 'pointer', flexShrink: 0 }}
                      >
                        {isDeleting ? '...' : <IconTrash size={13} />}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Actividad ── */}
      {activeTab === 'actividad' && (
        <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 18 }}>
          {/* Quick add */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 }}>
            <select
              value={actTipo}
              onChange={(e) => setActTipo(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {TIPOS_ACTIVIDAD.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
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
                  opacity: !actDesc.trim() || addingAct ? 0.5 : 1, flexShrink: 0,
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
                  <div key={a.id} style={{ display: 'flex', gap: 12, paddingBottom: i < actividades.length - 1 ? 14 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}18`, color }}>
                        {TIPO_ICON[a.tipo] ?? <IconNote size={14} />}
                      </div>
                      {i < actividades.length - 1 && (
                        <div style={{ width: 1, flex: 1, backgroundColor: '#f4f6f8', marginTop: 4 }} />
                      )}
                    </div>
                    <div style={{ flex: 1, paddingTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color, backgroundColor: `${color}12`, padding: '1px 6px', borderRadius: 999 }}>
                          {TIPOS_ACTIVIDAD.find((t) => t.value === a.tipo)?.label ?? a.tipo}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: '#1a1d1e', margin: '0 0 4px', lineHeight: 1.4 }}>{a.descripcion}</p>
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
      )}

      {/* ── Tab: Tareas ── */}
      {activeTab === 'tareas' && (
        <TabTareas proyectoId={proyecto.id} usuarios={usuarios} />
      )}

      {/* ── Tab: Campo ── */}
      {activeTab === 'campo' && (
        <TabCampo proyectoId={proyecto.id} />
      )}

      {/* ── Tab: Valorizaciones ── */}
      {activeTab === 'valorizaciones' && (
        <TabValorizaciones proyectoId={proyecto.id} valorizaciones={[]} />
      )}

      {/* ── Tab: Facturacion ── */}
      {activeTab === 'facturacion' && (
        <TabFacturacion proyectoId={proyecto.id} valorizaciones={valorizacionesIniciales} />
      )}
    </div>
  )
}

// ─── Mini components (pure, no hooks) ────────────────────────────────────────

function BackBtn({
  onClick, disabled, label,
}: {
  onClick: () => void; disabled: boolean; label: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 12, color: '#9ca3af',
        background: 'none', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        padding: '6px 4px',
        alignSelf: 'center',
      }}
    >
      {label}
    </button>
  )
}

function ActionBtn({
  onClick, disabled, bg, color, icon, label,
}: {
  onClick: () => void; disabled: boolean
  bg: string; color: string
  icon: React.ReactNode; label: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, fontWeight: 500,
        backgroundColor: bg, color,
        border: 'none', borderRadius: 6,
        padding: '6px 14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function MotivoInline({
  bg, color, placeholder, value, onChange, onConfirm, onCancel, disabled,
}: {
  bg: string; color: string; placeholder: string
  value: string; onChange: (v: string) => void
  onConfirm: () => void; onCancel: () => void
  disabled: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 10px', backgroundColor: bg, borderRadius: 6, flexWrap: 'wrap' }}>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && onConfirm()}
        placeholder={placeholder}
        style={{ fontSize: 12, padding: '4px 8px', border: `0.5px solid ${color}44`, borderRadius: 5, outline: 'none', width: 220, color: '#1a1d1e' }}
      />
      <button onClick={onConfirm} disabled={disabled} style={{ fontSize: 12, padding: '5px 10px', backgroundColor: color, color: '#fff', border: 'none', borderRadius: 5, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
        Confirmar
      </button>
      <button onClick={onCancel} style={{ fontSize: 12, padding: '5px 10px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 5, background: 'none', cursor: 'pointer' }}>
        Cancelar
      </button>
    </div>
  )
}

function MontoInline({
  value, onChange, onConfirm, onCancel, disabled,
}: {
  value: string; onChange: (v: string) => void
  onConfirm: () => void; onCancel: () => void
  disabled: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 10px', backgroundColor: '#e8f0fd', borderRadius: 6 }}>
      <input
        type="number" min="0" step="0.01" autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && onConfirm()}
        placeholder="Monto del contrato (S/)"
        style={{ fontSize: 12, padding: '4px 8px', border: '0.5px solid #004aad44', borderRadius: 5, outline: 'none', width: 220, color: '#1a1d1e' }}
      />
      <button onClick={onConfirm} disabled={disabled} style={{ fontSize: 12, padding: '5px 10px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 5, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
        Confirmar
      </button>
      <button onClick={onCancel} style={{ fontSize: 12, padding: '5px 10px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 5, background: 'none', cursor: 'pointer' }}>
        Cancelar
      </button>
    </div>
  )
}
