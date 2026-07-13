'use client'

import { useState, useEffect, useCallback } from 'react'
import { IconPlus, IconX, IconTrash } from '@tabler/icons-react'

interface Partida {
  id?: string; letra: string; descripcion: string; unidad: string
  metrado: number; precio_unitario: number; avance_pct: number; monto: number
}
interface Valorizacion {
  id: string; numero: number; periodo_inicio: string; periodo_fin: string
  estado: string; monto_total: number; partidas: Partida[]
  created_at: string
}

const ESTADO_VAL: Record<string, { bg: string; color: string; label: string }> = {
  en_elaboracion: { bg: '#f4f6f8', color: '#6b7280', label: 'En elaboración' },
  enviada_cliente:{ bg: '#e0f4fc', color: '#0c6a8c', label: 'Enviada al cliente' },
  aprobada:       { bg: '#eaf3de', color: '#3b6d11', label: 'Aprobada' },
  facturada:      { bg: '#e8f0fd', color: '#004aad', label: 'Facturada' },
}

function formatMonto(n: number) {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 })
}
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PARTIDA_BLANK: Partida = { letra: '', descripcion: '', unidad: 'glb', metrado: 1, precio_unitario: 0, avance_pct: 0, monto: 0 }

export default function TabValorizaciones({
  proyectoId,
  valorizaciones: iniciales,
}: {
  proyectoId: string
  valorizaciones: Valorizacion[]
}) {
  const [vals, setVals] = useState<Valorizacion[]>(iniciales)
  const [showForm, setShowForm] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Cambio de estado
  const [changingEstado, setChangingEstado] = useState<string | null>(null)

  // Form nueva valorización
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFin, setPeriodoFin]     = useState('')
  const [partidas, setPartidas] = useState<Partida[]>([{ ...PARTIDA_BLANK, letra: 'A' }])

  const fetchVals = useCallback(async () => {
    const res = await fetch(`/api/proyectos/${proyectoId}/valorizaciones`)
    if (res.ok) setVals(await res.json())
  }, [proyectoId])

  useEffect(() => { fetchVals() }, [fetchVals])

  function calcMontoPartida(p: Partida) {
    return Number(p.metrado) * Number(p.precio_unitario) * (Number(p.avance_pct) / 100)
  }

  function updatePartida(i: number, field: keyof Partida, value: string | number) {
    setPartidas((prev) => prev.map((p, j) => {
      if (j !== i) return p
      const updated = { ...p, [field]: value }
      updated.monto = calcMontoPartida(updated)
      return updated
    }))
  }

  const montoTotal = partidas.reduce((sum, p) => sum + calcMontoPartida(p), 0)

  async function handleCreate() {
    if (!periodoInicio || !periodoFin) { setError('El periodo es requerido'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/valorizaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo_inicio: periodoInicio, periodo_fin: periodoFin, partidas }),
      })
      if (!res.ok) { setError('Error al crear valorización'); return }
      await fetchVals()
      setShowForm(false)
      setPartidas([{ ...PARTIDA_BLANK, letra: 'A' }])
      setPeriodoInicio(''); setPeriodoFin('')
    } finally {
      setSaving(false)
    }
  }

  async function handleEstado(valId: string, estado: string) {
    setChangingEstado(valId)
    try {
      const res = await fetch(`/api/valorizaciones/${valId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      })
      if (res.ok) {
        const updated = await res.json()
        setVals((prev) => prev.map((v) => v.id === valId ? updated : v))
      }
    } finally {
      setChangingEstado(null)
    }
  }

  async function handleDelete(valId: string) {
    if (!confirm('¿Eliminar esta valorización?')) return
    const res = await fetch(`/api/valorizaciones/${valId}`, { method: 'DELETE' })
    if (res.ok) setVals((prev) => prev.filter((v) => v.id !== valId))
  }

  const inp: React.CSSProperties = {
    padding: '5px 8px', fontSize: 12,
    border: '0.5px solid #e8eaed', borderRadius: 5, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>Valorizaciones</span>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: '#ffffff', backgroundColor: '#004aad', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}
        >
          <IconPlus size={13} /> Nueva valorización
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 18, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>Nueva valorización</span>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
              <IconX size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Periodo inicio</label>
              <input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} style={{ ...inp, width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Periodo fin</label>
              <input type="date" value={periodoFin} onChange={(e) => setPeriodoFin(e.target.value)} style={{ ...inp, width: '100%' }} />
            </div>
          </div>

          {/* Tabla de partidas */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Partidas</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    {['Letra', 'Descripcion', 'Unid', 'Metrado', 'P.U. (S/)', 'Avance %', 'Monto (S/)', ''].map((h) => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {partidas.map((p, i) => (
                    <tr key={i} style={{ borderTop: '0.5px solid #f4f6f8' }}>
                      <td style={{ padding: '4px 4px' }}>
                        <input value={p.letra} onChange={(e) => updatePartida(i, 'letra', e.target.value)} style={{ ...inp, width: 40, textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '4px 4px' }}>
                        <input value={p.descripcion} onChange={(e) => updatePartida(i, 'descripcion', e.target.value)} style={{ ...inp, width: '100%', minWidth: 160 }} />
                      </td>
                      <td style={{ padding: '4px 4px' }}>
                        <input value={p.unidad} onChange={(e) => updatePartida(i, 'unidad', e.target.value)} style={{ ...inp, width: 50 }} />
                      </td>
                      <td style={{ padding: '4px 4px' }}>
                        <input type="number" min={0} value={p.metrado} onChange={(e) => updatePartida(i, 'metrado', Number(e.target.value))} style={{ ...inp, width: 70 }} />
                      </td>
                      <td style={{ padding: '4px 4px' }}>
                        <input type="number" min={0} value={p.precio_unitario} onChange={(e) => updatePartida(i, 'precio_unitario', Number(e.target.value))} style={{ ...inp, width: 90 }} />
                      </td>
                      <td style={{ padding: '4px 4px' }}>
                        <input type="number" min={0} max={100} value={p.avance_pct} onChange={(e) => updatePartida(i, 'avance_pct', Number(e.target.value))} style={{ ...inp, width: 60 }} />
                      </td>
                      <td style={{ padding: '4px 8px', fontWeight: 500, whiteSpace: 'nowrap', color: '#1a1d1e' }}>
                        {formatMonto(calcMontoPartida(p))}
                      </td>
                      <td style={{ padding: '4px 4px' }}>
                        <button onClick={() => setPartidas((prev) => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a32d2d' }}>
                          <IconX size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '1px solid #e8eaed' }}>
                    <td colSpan={6} style={{ padding: '8px', fontSize: 12, fontWeight: 600, textAlign: 'right', color: '#1a1d1e' }}>Total</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: '#004aad', whiteSpace: 'nowrap' }}>{formatMonto(montoTotal)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <button
              onClick={() => setPartidas((prev) => [
                ...prev,
                { ...PARTIDA_BLANK, letra: String.fromCharCode(65 + prev.length) }
              ])}
              style={{ fontSize: 11, color: '#004aad', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, padding: '4px 0' }}
            >
              + Agregar partida
            </button>
          </div>

          {error && <p style={{ fontSize: 12, color: '#a32d2d', marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCreate} disabled={saving} style={{ fontSize: 12, fontWeight: 500, padding: '7px 18px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Guardando...' : 'Crear valorización'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ fontSize: 12, padding: '7px 12px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {vals.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '48px 0', border: '1px dashed #e8eaed', borderRadius: 10 }}>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Sin valorizaciones. Crea la primera.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vals.map((v) => {
            const st = ESTADO_VAL[v.estado] ?? ESTADO_VAL.en_elaboracion
            const isOpen = expandido === v.id
            return (
              <div key={v.id} style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 8, overflow: 'hidden' }}>
                <div
                  onClick={() => setExpandido(isOpen ? null : v.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#004aad', flexShrink: 0, minWidth: 24 }}>#{v.numero}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1d1e' }}>
                      {formatFecha(v.periodo_inicio)} — {formatFecha(v.periodo_fin)}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{v.partidas.length} partidas</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e', flexShrink: 0 }}>{formatMonto(Number(v.monto_total))}</span>
                  <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 999, backgroundColor: st.bg, color: st.color, flexShrink: 0 }}>
                    {st.label}
                  </span>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 16px 16px', borderTop: '0.5px solid #f4f6f8' }}>
                    {/* Tabla partidas */}
                    <div style={{ overflowX: 'auto', marginTop: 12, marginBottom: 14 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb' }}>
                            {['Letra', 'Descripcion', 'Unidad', 'Metrado', 'P.U. (S/)', 'Avance %', 'Monto (S/)'].map((h) => (
                              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {v.partidas.map((p, i) => (
                            <tr key={i} style={{ borderTop: '0.5px solid #f4f6f8' }}>
                              <td style={{ padding: '7px 10px', fontWeight: 700, color: '#004aad' }}>{p.letra}</td>
                              <td style={{ padding: '7px 10px', color: '#1a1d1e' }}>{p.descripcion}</td>
                              <td style={{ padding: '7px 10px', color: '#6b7280' }}>{p.unidad}</td>
                              <td style={{ padding: '7px 10px' }}>{p.metrado}</td>
                              <td style={{ padding: '7px 10px' }}>{formatMonto(Number(p.precio_unitario))}</td>
                              <td style={{ padding: '7px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 60, height: 4, backgroundColor: '#e8eaed', borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${p.avance_pct}%`, backgroundColor: '#004aad', borderRadius: 2 }} />
                                  </div>
                                  <span>{Number(p.avance_pct)}%</span>
                                </div>
                              </td>
                              <td style={{ padding: '7px 10px', fontWeight: 500 }}>{formatMonto(Number(p.monto))}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: '1px solid #e8eaed', backgroundColor: '#f9fafb' }}>
                            <td colSpan={6} style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right', fontSize: 12 }}>TOTAL</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#004aad' }}>{formatMonto(Number(v.monto_total))}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Acciones de estado */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {v.estado === 'en_elaboracion' && (
                        <button
                          onClick={() => handleEstado(v.id, 'enviada_cliente')}
                          disabled={changingEstado === v.id}
                          style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', backgroundColor: '#0ca3df', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        >
                          Enviar al cliente
                        </button>
                      )}
                      {v.estado === 'enviada_cliente' && (
                        <button
                          onClick={() => handleEstado(v.id, 'aprobada')}
                          disabled={changingEstado === v.id}
                          style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', backgroundColor: '#eaf3de', color: '#3b6d11', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        >
                          Marcar aprobada
                        </button>
                      )}
                      {v.estado === 'aprobada' && (
                        <button
                          onClick={() => handleEstado(v.id, 'facturada')}
                          disabled={changingEstado === v.id}
                          style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', backgroundColor: '#e8f0fd', color: '#004aad', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                        >
                          Marcar facturada
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(v.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#a32d2d', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                      >
                        <IconTrash size={13} /> Eliminar
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
