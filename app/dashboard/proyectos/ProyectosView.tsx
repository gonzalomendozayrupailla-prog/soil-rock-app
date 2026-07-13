'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconSearch, IconFolderPlus } from '@tabler/icons-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Proyecto {
  id: string
  codigo: string
  nombre: string
  fase: string
  sector: string
  monto_contrato: number
  avance_general: number
  fecha_inicio: string
  fecha_cierre_estimada: string
  cliente: { razon_social: string }
  ingeniero: { nombre: string }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FASE_LABELS: Record<string, string> = {
  adjudicado: 'Adjudicado',
  ejecucion:  'Ejecución',
  cierre:     'Cierre',
  cerrado:    'Cerrado',
  cancelado:  'Cancelado',
}

const FASE_STYLES: Record<string, { bg: string; color: string }> = {
  adjudicado: { bg: '#eaf3de', color: '#3b6d11' },
  ejecucion:  { bg: '#e8f0fd', color: '#004aad' },
  cierre:     { bg: '#f4f6f8', color: '#6b7280' },
  cerrado:    { bg: '#f4f6f8', color: '#6b7280' },
  cancelado:  { bg: '#fcebeb', color: '#a32d2d' },
}

const TABS_DEF = [
  { key: 'todos',      label: 'Todos',        fases: ['adjudicado', 'ejecucion', 'cierre', 'cerrado', 'cancelado'] },
  { key: 'adjudicado', label: 'Por iniciar',  fases: ['adjudicado'] },
  { key: 'ejecucion',  label: 'En ejecución', fases: ['ejecucion'] },
  { key: 'cierre',     label: 'En cierre',    fases: ['cierre'] },
  { key: 'cerrado',    label: 'Cerrados',     fases: ['cerrado'] },
  { key: 'cancelado',  label: 'Cancelados',   fases: ['cancelado'] },
] as const

type TabKey = (typeof TABS_DEF)[number]['key']

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProyectosView({ proyectos }: { proyectos: Proyecto[] }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('ejecucion')
  const [search, setSearch] = useState('')

  // Counts per tab (ignoring search, so always visible)
  const counts = Object.fromEntries(
    TABS_DEF.map((t) => [t.key, proyectos.filter((p) => (t.fases as readonly string[]).includes(p.fase)).length])
  )

  const filtered = proyectos.filter((p) => {
    const tab = TABS_DEF.find((t) => t.key === activeTab)!
    if (!(tab.fases as readonly string[]).includes(p.fase)) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      p.cliente.razon_social.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left Panel: List ─────────────────────────────────────────────── */}
      <div
        style={{
          width: 300,
          minWidth: 300,
          backgroundColor: '#ffffff',
          borderRight: '0.5px solid #e8eaed',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Search + New */}
        <div style={{ padding: '14px 12px 8px', display: 'flex', gap: 6 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <IconSearch
              size={13}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#b0b7c3', pointerEvents: 'none' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o código..."
              style={{
                width: '100%',
                paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                fontSize: 13,
                border: '0.5px solid #e8eaed',
                borderRadius: 7,
                outline: 'none',
                backgroundColor: '#f4f6f8',
                color: '#1a1d1e',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <Link
            href="/dashboard/proyectos/nuevo"
            title="Nuevo proyecto"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32,
              borderRadius: 7,
              backgroundColor: '#004aad',
              color: '#ffffff',
              flexShrink: 0,
              alignSelf: 'center',
            }}
          >
            <IconFolderPlus size={15} />
          </Link>
        </div>

        {/* Filter Tabs */}
        <div style={{ overflowX: 'auto', borderBottom: '0.5px solid #e8eaed', flexShrink: 0 }}>
          <div style={{ display: 'flex', padding: '0 8px', minWidth: 'max-content' }}>
            {TABS_DEF.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '7px 8px',
                  fontSize: 12,
                  fontWeight: activeTab === t.key ? 500 : 400,
                  color: activeTab === t.key ? '#004aad' : '#6b7280',
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  borderBottom: activeTab === t.key ? '2px solid #004aad' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
                {counts[t.key] > 0 && (
                  <span
                    style={{
                      fontSize: 10, fontWeight: 500,
                      backgroundColor: activeTab === t.key ? '#e8f0fd' : '#f4f6f8',
                      color: activeTab === t.key ? '#004aad' : '#9ca3af',
                      padding: '1px 5px', borderRadius: 999,
                    }}
                  >
                    {counts[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Project List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <p style={{ padding: 20, textAlign: 'center', fontSize: 13, color: '#b0b7c3' }}>
              Sin proyectos
            </p>
          ) : (
            filtered.map((p) => {
              const faseStyle = FASE_STYLES[p.fase] ?? { bg: '#f4f6f8', color: '#6b7280' }
              return (
                <button
                  key={p.id}
                  onClick={() => router.push(`/dashboard/proyectos/${p.id}`)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    marginBottom: 4,
                    borderRadius: 8,
                    border: '0.5px solid #e8eaed',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f9fafb' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>
                      {p.codigo}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 999,
                      backgroundColor: faseStyle.bg, color: faseStyle.color,
                    }}>
                      {FASE_LABELS[p.fase] ?? p.fase}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e', marginBottom: 2, lineHeight: 1.3 }}>
                    {p.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                    {p.cliente.razon_social}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 4, backgroundColor: '#e8eaed', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.avance_general}%`, backgroundColor: '#004aad', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#9ca3af', minWidth: 30, textAlign: 'right' }}>
                      {p.avance_general}%
                    </span>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right: Placeholder ───────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <p style={{ fontSize: 14, color: '#b0b7c3', margin: 0 }}>
          Selecciona un proyecto para ver el detalle
        </p>
        <p style={{ fontSize: 12, color: '#d1d5db', margin: 0 }}>
          O haz clic en una oportunidad adjudicada desde el Pipeline
        </p>
      </div>
    </div>
  )
}
