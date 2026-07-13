'use client'

import { useState, useEffect, useCallback } from 'react'
import { IconPlus, IconX, IconCloudRain, IconSun, IconCloud, IconBolt, IconAlertTriangle } from '@tabler/icons-react'

interface PersonalItem { nombre: string; rol: string; horas: number }
interface EquipoItem { tipo: string; horas: number }
interface ReporteCampo {
  id: string; fecha: string; descripcion: string; clima: string
  incidente: boolean; desc_incidente?: string | null
  usuario: { nombre: string }
  personal: PersonalItem[]
  equipos: EquipoItem[]
  created_at: string
}

const CLIMAS = [
  { value: 'soleado', label: 'Soleado', icon: <IconSun size={20} /> },
  { value: 'nublado', label: 'Nublado', icon: <IconCloud size={20} /> },
  { value: 'lluvia',  label: 'Lluvia',  icon: <IconCloudRain size={20} /> },
  { value: 'tormenta',label: 'Tormenta',icon: <IconBolt size={20} /> },
]

const ROLES_CAMPO = ['Ingeniero', 'Tecnico', 'Peon', 'Operador', 'Topografo']

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function ClimaIcon({ clima }: { clima: string }) {
  const c = CLIMAS.find((x) => x.value === clima)
  return <span title={c?.label ?? clima}>{c?.icon ?? clima}</span>
}

export default function TabCampo({ proyectoId }: { proyectoId: string }) {
  const [reportes, setReportes] = useState<ReporteCampo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)

  // Form
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [descripcion, setDescripcion] = useState('')
  const [clima, setClima] = useState('soleado')
  const [incidente, setIncidente] = useState(false)
  const [descIncidente, setDescIncidente] = useState('')
  const [personal, setPersonal] = useState<PersonalItem[]>([{ nombre: '', rol: ROLES_CAMPO[0], horas: 8 }])
  const [equipos, setEquipos] = useState<EquipoItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchReportes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/campo`)
      if (res.ok) setReportes(await res.json())
    } finally {
      setLoading(false)
    }
  }, [proyectoId])

  useEffect(() => { fetchReportes() }, [fetchReportes])

  async function handleCreate() {
    if (!descripcion.trim()) { setError('La descripcion es requerida'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/campo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha,
          descripcion: descripcion.trim(),
          clima,
          incidente,
          desc_incidente: incidente ? descIncidente : undefined,
          personal: personal.filter((p) => p.nombre.trim()),
          equipos: equipos.filter((e) => e.tipo.trim()),
        }),
      })
      if (!res.ok) { setError('Error al guardar'); return }
      const nuevo = await res.json()
      setReportes((prev) => [nuevo, ...prev])
      // reset form
      setDescripcion('')
      setClima('soleado')
      setIncidente(false)
      setDescIncidente('')
      setPersonal([{ nombre: '', rol: ROLES_CAMPO[0], horas: 8 }])
      setEquipos([])
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const inp: React.CSSProperties = {
    padding: '6px 10px', fontSize: 12,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>Reportes de campo</span>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 500, color: '#ffffff', backgroundColor: '#004aad',
            border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
          }}
        >
          <IconPlus size={13} /> Nuevo reporte
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>Nuevo reporte de campo</span>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
              <IconX size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ ...inp, width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Clima</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {CLIMAS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setClima(c.value)}
                    title={c.label}
                    style={{
                      width: 38, height: 38, borderRadius: 8, cursor: 'pointer',
                      border: clima === c.value ? '2px solid #004aad' : '1px solid #e8eaed',
                      backgroundColor: clima === c.value ? '#e8f0fd' : '#f9fafb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: clima === c.value ? '#004aad' : '#6b7280',
                    }}
                  >
                    {c.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Descripcion del avance *</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe el trabajo realizado hoy..."
              rows={3}
              style={{ ...inp, width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Personal */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, color: '#9ca3af' }}>Personal en campo</label>
              <button
                onClick={() => setPersonal((p) => [...p, { nombre: '', rol: ROLES_CAMPO[0], horas: 8 }])}
                style={{ fontSize: 11, color: '#004aad', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                + Agregar
              </button>
            </div>
            {personal.map((p, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <input
                  placeholder="Nombre"
                  value={p.nombre}
                  onChange={(e) => setPersonal((prev) => prev.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))}
                  style={{ ...inp }}
                />
                <select
                  value={p.rol}
                  onChange={(e) => setPersonal((prev) => prev.map((x, j) => j === i ? { ...x, rol: e.target.value } : x))}
                  style={{ ...inp, cursor: 'pointer' }}
                >
                  {ROLES_CAMPO.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <input
                  type="number" min={1} max={24}
                  value={p.horas}
                  onChange={(e) => setPersonal((prev) => prev.map((x, j) => j === i ? { ...x, horas: Number(e.target.value) } : x))}
                  style={{ ...inp, width: 60 }}
                />
                <button onClick={() => setPersonal((prev) => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a32d2d' }}>
                  <IconX size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Equipos */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, color: '#9ca3af' }}>Equipos utilizados</label>
              <button
                onClick={() => setEquipos((e) => [...e, { tipo: '', horas: 8 }])}
                style={{ fontSize: 11, color: '#004aad', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                + Agregar
              </button>
            </div>
            {equipos.map((eq, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <input
                  placeholder="Tipo de equipo"
                  value={eq.tipo}
                  onChange={(e) => setEquipos((prev) => prev.map((x, j) => j === i ? { ...x, tipo: e.target.value } : x))}
                  style={{ ...inp }}
                />
                <input
                  type="number" min={1} max={24}
                  value={eq.horas}
                  onChange={(e) => setEquipos((prev) => prev.map((x, j) => j === i ? { ...x, horas: Number(e.target.value) } : x))}
                  style={{ ...inp, width: 60 }}
                />
                <button onClick={() => setEquipos((prev) => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a32d2d' }}>
                  <IconX size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Incidente */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={incidente} onChange={(e) => setIncidente(e.target.checked)} />
              <IconAlertTriangle size={14} style={{ color: '#854f0b' }} />
              Hubo un incidente
            </label>
            {incidente && (
              <textarea
                value={descIncidente}
                onChange={(e) => setDescIncidente(e.target.value)}
                placeholder="Describe el incidente..."
                rows={2}
                style={{ ...inp, width: '100%', marginTop: 8, resize: 'vertical' }}
              />
            )}
          </div>

          {error && <p style={{ fontSize: 12, color: '#a32d2d', marginBottom: 10 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCreate}
              disabled={saving}
              style={{ fontSize: 12, fontWeight: 500, padding: '7px 18px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Guardando...' : 'Guardar reporte'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ fontSize: 12, padding: '7px 12px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando...</p>
      ) : reportes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', border: '1px dashed #e8eaed', borderRadius: 10 }}>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Sin reportes de campo. Crea el primero.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reportes.map((r) => (
            <div key={r.id} style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 8, overflow: 'hidden' }}>
              <div
                onClick={() => setExpandido(expandido === r.id ? null : r.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 22 }}><ClimaIcon clima={r.clima} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1d1e' }}>{formatFecha(r.fecha)}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {r.usuario.nombre} · {r.personal.length} persona{r.personal.length !== 1 ? 's' : ''}
                    {r.incidente && <span style={{ color: '#a32d2d', marginLeft: 8 }}><IconAlertTriangle size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />Incidente</span>}
                  </div>
                </div>
              </div>

              {expandido === r.id && (
                <div style={{ padding: '0 16px 14px', borderTop: '0.5px solid #f4f6f8' }}>
                  <p style={{ fontSize: 13, color: '#1a1d1e', margin: '12px 0 10px', lineHeight: 1.5 }}>{r.descripcion}</p>

                  {r.personal.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personal</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {r.personal.map((p, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '3px 8px', backgroundColor: '#f4f6f8', borderRadius: 999, color: '#5b5b5b' }}>
                            {p.nombre} ({p.rol}) · {p.horas}h
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {r.equipos.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Equipos</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {r.equipos.map((e, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '3px 8px', backgroundColor: '#f4f6f8', borderRadius: 999, color: '#5b5b5b' }}>
                            {e.tipo} · {e.horas}h
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {r.incidente && r.desc_incidente && (
                    <div style={{ backgroundColor: '#faeeda', borderRadius: 6, padding: '8px 12px', marginTop: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#854f0b', marginBottom: 3 }}>
                        <IconAlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Incidente
                      </div>
                      <p style={{ fontSize: 12, color: '#1a1d1e', margin: 0 }}>{r.desc_incidente}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
