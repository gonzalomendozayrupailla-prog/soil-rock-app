'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  IconCircle, IconCircleCheck, IconAlertTriangle, IconFolderOpen,
} from '@tabler/icons-react'

interface Proyecto { id: string; nombre: string; codigo: string }
interface Subtarea { id: string; titulo: string; completada: boolean }
interface Tarea {
  id: string; titulo: string; descripcion?: string | null; seccion: string
  estado: string; prioridad: string; fecha_limite?: string | null
  proyecto: Proyecto
  subtareas: Subtarea[]
  created_at: string
}

const PRIORIDAD: Record<string, { bg: string; color: string; label: string }> = {
  alta:  { bg: '#fcebeb', color: '#a32d2d', label: 'Alta' },
  media: { bg: '#faeeda', color: '#854f0b', label: 'Media' },
  baja:  { bg: '#f4f6f8', color: '#6b7280', label: 'Baja' },
}

const ESTADO: Record<string, { bg: string; color: string; label: string }> = {
  pendiente:   { bg: '#f4f6f8', color: '#6b7280',  label: 'Pendiente' },
  en_progreso: { bg: '#e8f0fd', color: '#004aad',  label: 'En progreso' },
  completada:  { bg: '#eaf3de', color: '#3b6d11',  label: 'Completada' },
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
function isHoy(iso?: string | null) {
  if (!iso) return false
  const d = new Date(iso)
  const hoy = new Date()
  return d.toDateString() === hoy.toDateString()
}
function isSemana(iso?: string | null) {
  if (!iso) return false
  const d = new Date(iso)
  const now = Date.now()
  const diff = d.getTime() - now
  return diff > 0 && diff <= 7 * 86400000
}

type Grupo = 'Vencidas' | 'Hoy' | 'Esta semana' | 'Proximamente' | 'Sin fecha' | 'Completadas'

function agrupar(tareas: Tarea[]): Record<Grupo, Tarea[]> {
  const grupos: Record<Grupo, Tarea[]> = {
    'Vencidas': [], 'Hoy': [], 'Esta semana': [], 'Proximamente': [], 'Sin fecha': [], 'Completadas': [],
  }
  for (const t of tareas) {
    if (t.estado === 'completada') { grupos['Completadas'].push(t); continue }
    if (!t.fecha_limite) { grupos['Sin fecha'].push(t); continue }
    if (isVencida(t.fecha_limite)) { grupos['Vencidas'].push(t); continue }
    if (isHoy(t.fecha_limite)) { grupos['Hoy'].push(t); continue }
    if (isSemana(t.fecha_limite)) { grupos['Esta semana'].push(t); continue }
    grupos['Proximamente'].push(t)
  }
  return grupos
}

export default function MisTareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [agrupadoPor, setAgrupadoPor] = useState<'fecha' | 'proyecto' | 'prioridad'>('fecha')

  useEffect(() => {
    fetch('/api/mis-tareas')
      .then((r) => r.json())
      .then((data) => { setTareas(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function toggleEstado(tarea: Tarea) {
    const nuevoEstado = tarea.estado === 'completada' ? 'pendiente' : 'completada'
    const res = await fetch(`/api/tareas/${tarea.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    if (res.ok) {
      setTareas((prev) => prev.map((t) => t.id === tarea.id ? { ...t, estado: nuevoEstado } : t))
    }
  }

  const ORDEN_GRUPOS: Grupo[] = ['Vencidas', 'Hoy', 'Esta semana', 'Proximamente', 'Sin fecha', 'Completadas']

  function renderTarea(t: Tarea) {
    const p = PRIORIDAD[t.prioridad]
    const e = ESTADO[t.estado]
    const vencida = isVencida(t.fecha_limite) && t.estado !== 'completada'
    const completadas = t.subtareas.filter((s) => s.completada).length
    return (
      <div
        key={t.id}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          borderBottom: '0.5px solid #f4f6f8',
        }}
      >
        <button
          onClick={() => toggleEstado(t)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, color: t.estado === 'completada' ? '#3b6d11' : '#d1d5db' }}
        >
          {t.estado === 'completada' ? <IconCircleCheck size={16} /> : <IconCircle size={16} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 13, color: t.estado === 'completada' ? '#9ca3af' : '#1a1d1e',
              textDecoration: t.estado === 'completada' ? 'line-through' : 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {t.titulo}
            </span>
            {t.subtareas.length > 0 && (
              <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>
                {completadas}/{t.subtareas.length}
              </span>
            )}
          </div>
          <Link href={`/dashboard/proyectos/${t.proyecto.id}`} style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 11, color: '#004aad', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
              <IconFolderOpen size={11} /> {t.proyecto.codigo} — {t.proyecto.nombre}
            </span>
          </Link>
        </div>

        {t.fecha_limite && (
          <span style={{ fontSize: 11, color: vencida ? '#a32d2d' : '#9ca3af', flexShrink: 0 }}>
            {vencida && <IconAlertTriangle size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />}
            {formatFecha(t.fecha_limite)}
          </span>
        )}

        <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 7px', borderRadius: 999, backgroundColor: p.bg, color: p.color, flexShrink: 0 }}>
          {p.label}
        </span>
        <span style={{ fontSize: 10, fontWeight: 500, padding: '1px 7px', borderRadius: 999, backgroundColor: e.bg, color: e.color, flexShrink: 0 }}>
          {e.label}
        </span>
      </div>
    )
  }

  const totalPendientes = tareas.filter((t) => t.estado !== 'completada').length

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: '#1a1d1e', margin: 0 }}>
          Mis tareas
          {totalPendientes > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: 10, minWidth: 20, height: 20, borderRadius: 10,
              backgroundColor: '#004aad', color: '#fff', fontSize: 11, fontWeight: 700, padding: '0 6px',
            }}>
              {totalPendientes}
            </span>
          )}
        </h1>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '3px 0 0' }}>Todas tus tareas de todos los proyectos</p>
      </div>

      {/* Agrupacion */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['fecha', 'proyecto', 'prioridad'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setAgrupadoPor(v)}
            style={{
              fontSize: 12, padding: '4px 12px', borderRadius: 6,
              border: '0.5px solid #e8eaed',
              backgroundColor: agrupadoPor === v ? '#004aad' : '#ffffff',
              color: agrupadoPor === v ? '#ffffff' : '#6b7280',
              cursor: 'pointer',
            }}
          >
            {v === 'fecha' ? 'Por fecha' : v === 'proyecto' ? 'Por proyecto' : 'Por prioridad'}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando tareas...</p>
      ) : tareas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed #e8eaed', borderRadius: 10 }}>
          <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>No tienes tareas asignadas.</p>
          <p style={{ fontSize: 12, color: '#b0b7c3', margin: '6px 0 0' }}>Las tareas aparecen aqui cuando te las asignen en un proyecto.</p>
        </div>
      ) : agrupadoPor === 'fecha' ? (
        (() => {
          const grupos = agrupar(tareas)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ORDEN_GRUPOS.map((grupo) => {
                const items = grupos[grupo]
                if (items.length === 0) return null
                return (
                  <div key={grupo}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: grupo === 'Vencidas' || grupo === 'Hoy' ? '#a32d2d' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      {grupo} <span style={{ fontWeight: 400, color: '#b0b7c3' }}>({items.length})</span>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 8, overflow: 'hidden' }}>
                      {items.map(renderTarea)}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()
      ) : agrupadoPor === 'proyecto' ? (
        (() => {
          const byProject: Record<string, { proyecto: Proyecto; tareas: Tarea[] }> = {}
          for (const t of tareas) {
            if (!byProject[t.proyecto.id]) byProject[t.proyecto.id] = { proyecto: t.proyecto, tareas: [] }
            byProject[t.proyecto.id].tareas.push(t)
          }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.values(byProject).map(({ proyecto, tareas: items }) => (
                <div key={proyecto.id}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#004aad', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconFolderOpen size={13} />
                    {proyecto.codigo} — {proyecto.nombre}
                    <span style={{ fontWeight: 400, color: '#b0b7c3' }}>({items.length})</span>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 8, overflow: 'hidden' }}>
                    {items.map(renderTarea)}
                  </div>
                </div>
              ))}
            </div>
          )
        })()
      ) : (
        (() => {
          const byPrio: Record<string, Tarea[]> = { alta: [], media: [], baja: [] }
          for (const t of tareas) byPrio[t.prioridad]?.push(t)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(['alta', 'media', 'baja'] as const).map((prio) => {
                const items = byPrio[prio]
                if (items.length === 0) return null
                const p = PRIORIDAD[prio]
                return (
                  <div key={prio}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, color: p.color }}>
                      Prioridad {p.label} <span style={{ fontWeight: 400, color: '#b0b7c3' }}>({items.length})</span>
                    </div>
                    <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 8, overflow: 'hidden' }}>
                      {items.map(renderTarea)}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()
      )}
    </div>
  )
}
