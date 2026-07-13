'use client'

import { useState, useEffect, useCallback } from 'react'
import { IconPlus, IconX, IconAlertTriangle } from '@tabler/icons-react'

interface Valorizacion { id: string; numero: number }
interface Factura {
  id: string; numero: string; monto: number; fecha_emision: string
  fecha_vencimiento: string; estado: string; retencion_pct: number; monto_neto: number
  metodo_pago?: string | null
  valorizacion?: { id: string; numero: number } | null
}
interface Garantia {
  id: string; tipo: string; monto: number; porcentaje: number
  fecha_vencimiento: string; estado: string; documento_url?: string | null
}

const ESTADO_FAC: Record<string, { bg: string; color: string; label: string }> = {
  emitida:  { bg: '#faeeda', color: '#854f0b', label: 'Emitida' },
  cobrada:  { bg: '#eaf3de', color: '#3b6d11', label: 'Cobrada' },
  vencida:  { bg: '#fcebeb', color: '#a32d2d', label: 'Vencida' },
  anulada:  { bg: '#f4f6f8', color: '#6b7280', label: 'Anulada' },
}

const TIPO_GARANTIA: Record<string, string> = {
  fiel_cumplimiento:     'Fiel cumplimiento',
  garantia_tecnica:      'Garantía técnica',
  retencion_contractual: 'Retención contractual',
}
const ESTADO_GAR: Record<string, { bg: string; color: string; label: string }> = {
  retenida:    { bg: '#faeeda', color: '#854f0b', label: 'Retenida' },
  en_gestion:  { bg: '#e0f4fc', color: '#0c6a8c', label: 'En gestión' },
  recuperada:  { bg: '#eaf3de', color: '#3b6d11', label: 'Recuperada' },
}

function formatMonto(n: number) {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 })
}
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
function diasParaVencer(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

export default function TabFacturacion({
  proyectoId,
  valorizaciones,
}: {
  proyectoId: string
  valorizaciones: Valorizacion[]
}) {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [garantias, setGarantias] = useState<Garantia[]>([])
  const [valsInternas, setValsInternas] = useState<Valorizacion[]>(valorizaciones)
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState<'facturas' | 'garantias'>('facturas')

  // Forms
  const [showFacForm, setShowFacForm] = useState(false)
  const [showGarForm, setShowGarForm] = useState(false)

  // Factura form
  const [facForm, setFacForm] = useState({
    numero: '', monto: '', fecha_emision: new Date().toISOString().slice(0, 10),
    fecha_vencimiento: '', retencion_pct: '0', valorizacion_id: '', metodo_pago: '',
  })

  // Garantia form
  const [garForm, setGarForm] = useState({
    tipo: 'fiel_cumplimiento', monto: '', porcentaje: '0',
    fecha_vencimiento: '', documento_url: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [facRes, garRes] = await Promise.all([
        fetch(`/api/proyectos/${proyectoId}/facturas`),
        fetch(`/api/proyectos/${proyectoId}/garantias`),
      ])
      if (facRes.ok) setFacturas(await facRes.json())
      if (garRes.ok) setGarantias(await garRes.json())
    } finally {
      setLoading(false)
    }
  }, [proyectoId])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCreateFactura() {
    if (!facForm.numero || !facForm.monto || !facForm.fecha_emision || !facForm.fecha_vencimiento) {
      setError('Completa todos los campos requeridos'); return
    }
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/facturas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: facForm.numero,
          monto: Number(facForm.monto),
          fecha_emision: facForm.fecha_emision,
          fecha_vencimiento: facForm.fecha_vencimiento,
          retencion_pct: Number(facForm.retencion_pct),
          valorizacion_id: facForm.valorizacion_id || undefined,
          metodo_pago: facForm.metodo_pago || undefined,
        }),
      })
      if (!res.ok) { setError('Error al crear factura'); return }
      const nueva = await res.json()
      setFacturas((prev) => [nueva, ...prev])
      setShowFacForm(false)
      setFacForm({ numero: '', monto: '', fecha_emision: new Date().toISOString().slice(0, 10), fecha_vencimiento: '', retencion_pct: '0', valorizacion_id: '', metodo_pago: '' })
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateGarantia() {
    if (!garForm.monto || !garForm.fecha_vencimiento) {
      setError('Completa todos los campos requeridos'); return
    }
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/garantias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: garForm.tipo,
          monto: Number(garForm.monto),
          porcentaje: Number(garForm.porcentaje),
          fecha_vencimiento: garForm.fecha_vencimiento,
          documento_url: garForm.documento_url || undefined,
        }),
      })
      if (!res.ok) { setError('Error al crear garantia'); return }
      const nueva = await res.json()
      setGarantias((prev) => [...prev, nueva])
      setShowGarForm(false)
      setGarForm({ tipo: 'fiel_cumplimiento', monto: '', porcentaje: '0', fecha_vencimiento: '', documento_url: '' })
    } finally {
      setSaving(false)
    }
  }

  async function handleEstadoFactura(facId: string, estado: string) {
    const res = await fetch(`/api/facturas/${facId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    if (res.ok) {
      const upd = await res.json()
      setFacturas((prev) => prev.map((f) => f.id === facId ? upd : f))
    }
  }

  async function handleEstadoGarantia(garId: string, estado: string) {
    const res = await fetch(`/api/garantias/${garId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    if (res.ok) {
      const upd = await res.json()
      setGarantias((prev) => prev.map((g) => g.id === garId ? upd : g))
    }
  }

  async function handleDeleteGarantia(garId: string) {
    if (!confirm('¿Eliminar garantia?')) return
    const res = await fetch(`/api/garantias/${garId}`, { method: 'DELETE' })
    if (res.ok) setGarantias((prev) => prev.filter((g) => g.id !== garId))
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '6px 10px', fontSize: 12,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e8eaed', marginBottom: 16, gap: 0 }}>
        {(['facturas', 'garantias'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveSubTab(t)}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 500,
              color: activeSubTab === t ? '#004aad' : '#9ca3af',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeSubTab === t ? '2px solid #004aad' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t === 'facturas' ? `Facturas (${facturas.length})` : `Garantias (${garantias.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando...</p>
      ) : activeSubTab === 'facturas' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              onClick={() => setShowFacForm(!showFacForm)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: '#ffffff', backgroundColor: '#004aad', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}
            >
              <IconPlus size={13} /> Nueva factura
            </button>
          </div>

          {showFacForm && (
            <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Nueva factura</span>
                <button onClick={() => setShowFacForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={16} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>N° Factura *</label>
                  <input value={facForm.numero} onChange={(e) => setFacForm((p) => ({ ...p, numero: e.target.value }))} placeholder="E001-0001" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Monto (S/) *</label>
                  <input type="number" min={0} value={facForm.monto} onChange={(e) => setFacForm((p) => ({ ...p, monto: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Fecha emision *</label>
                  <input type="date" value={facForm.fecha_emision} onChange={(e) => setFacForm((p) => ({ ...p, fecha_emision: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Fecha vencimiento *</label>
                  <input type="date" value={facForm.fecha_vencimiento} onChange={(e) => setFacForm((p) => ({ ...p, fecha_vencimiento: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Retencion de garantia (%)</label>
                  <input type="number" min={0} max={100} value={facForm.retencion_pct} onChange={(e) => setFacForm((p) => ({ ...p, retencion_pct: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Valorizacion vinculada</label>
                  <select value={facForm.valorizacion_id} onChange={(e) => setFacForm((p) => ({ ...p, valorizacion_id: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Sin valorizacion</option>
                    {valorizaciones.map((v) => <option key={v.id} value={v.id}>Val. #{v.numero}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Metodo de pago</label>
                  <select value={facForm.metodo_pago} onChange={(e) => setFacForm((p) => ({ ...p, metodo_pago: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Por definir</option>
                    <option value="transferencia">Transferencia bancaria</option>
                    <option value="cheque">Cheque</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="carta_credito">Carta de credito</option>
                  </select>
                </div>
              </div>
              {facForm.monto && facForm.retencion_pct && Number(facForm.retencion_pct) > 0 && (
                <div style={{ backgroundColor: '#f9fafb', borderRadius: 6, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#1a1d1e' }}>
                  Monto neto: <strong>{formatMonto(Number(facForm.monto) - Number(facForm.monto) * (Number(facForm.retencion_pct) / 100))}</strong>
                  <span style={{ color: '#9ca3af', marginLeft: 8 }}>(retencion: {formatMonto(Number(facForm.monto) * Number(facForm.retencion_pct) / 100)})</span>
                </div>
              )}
              {error && <p style={{ fontSize: 12, color: '#a32d2d', marginBottom: 10 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCreateFactura} disabled={saving} style={{ fontSize: 12, fontWeight: 500, padding: '6px 16px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  {saving ? 'Guardando...' : 'Crear factura'}
                </button>
                <button onClick={() => setShowFacForm(false)} style={{ fontSize: 12, padding: '6px 12px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {facturas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed #e8eaed', borderRadius: 10 }}>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Sin facturas registradas.</p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 8, overflow: 'hidden' }}>
              {facturas.map((f, i) => {
                const st = ESTADO_FAC[f.estado] ?? ESTADO_FAC.emitida
                const dias = diasParaVencer(f.fecha_vencimiento)
                const alerta = f.estado === 'emitida' && dias <= 7
                const vencida = f.estado === 'emitida' && dias < 0
                return (
                  <div key={f.id} style={{ padding: '13px 16px', borderBottom: i < facturas.length - 1 ? '0.5px solid #f4f6f8' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>{f.numero}</span>
                          {f.valorizacion && <span style={{ fontSize: 11, color: '#9ca3af' }}>Val. #{f.valorizacion.numero}</span>}
                          {(alerta || vencida) && (
                            <span style={{ fontSize: 10, color: vencida ? '#a32d2d' : '#854f0b' }}>
                              <IconAlertTriangle size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                              {vencida ? 'Vencida' : `Vence en ${dias}d`}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                          Emitida: {formatFecha(f.fecha_emision)} · Vence: {formatFecha(f.fecha_vencimiento)}
                          {f.metodo_pago && ` · ${f.metodo_pago}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1d1e' }}>{formatMonto(Number(f.monto))}</div>
                        {Number(f.retencion_pct) > 0 && (
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>Neto: {formatMonto(Number(f.monto_neto))}</div>
                        )}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 999, backgroundColor: st.bg, color: st.color, flexShrink: 0 }}>
                        {st.label}
                      </span>
                    </div>
                    {f.estado === 'emitida' && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button onClick={() => handleEstadoFactura(f.id, 'cobrada')} style={{ fontSize: 11, padding: '3px 10px', backgroundColor: '#eaf3de', color: '#3b6d11', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
                          Registrar cobro
                        </button>
                        <button onClick={() => handleEstadoFactura(f.id, 'anulada')} style={{ fontSize: 11, padding: '3px 10px', backgroundColor: '#f4f6f8', color: '#6b7280', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
                          Anular
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* GARANTIAS */
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              onClick={() => setShowGarForm(!showGarForm)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: '#ffffff', backgroundColor: '#004aad', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}
            >
              <IconPlus size={13} /> Nueva garantia
            </button>
          </div>

          {showGarForm && (
            <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Nueva garantia</span>
                <button onClick={() => setShowGarForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={16} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Tipo</label>
                  <select value={garForm.tipo} onChange={(e) => setGarForm((p) => ({ ...p, tipo: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    {Object.entries(TIPO_GARANTIA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Monto (S/) *</label>
                  <input type="number" min={0} value={garForm.monto} onChange={(e) => setGarForm((p) => ({ ...p, monto: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Porcentaje (%)</label>
                  <input type="number" min={0} max={100} value={garForm.porcentaje} onChange={(e) => setGarForm((p) => ({ ...p, porcentaje: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Vencimiento *</label>
                  <input type="date" value={garForm.fecha_vencimiento} onChange={(e) => setGarForm((p) => ({ ...p, fecha_vencimiento: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>URL documento (opcional)</label>
                  <input value={garForm.documento_url} onChange={(e) => setGarForm((p) => ({ ...p, documento_url: e.target.value }))} placeholder="https://..." style={inp} />
                </div>
              </div>
              {error && <p style={{ fontSize: 12, color: '#a32d2d', marginBottom: 10 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCreateGarantia} disabled={saving} style={{ fontSize: 12, fontWeight: 500, padding: '6px 16px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  {saving ? 'Guardando...' : 'Crear garantia'}
                </button>
                <button onClick={() => setShowGarForm(false)} style={{ fontSize: 12, padding: '6px 12px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {garantias.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed #e8eaed', borderRadius: 10 }}>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Sin garantias registradas.</p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 8, overflow: 'hidden' }}>
              {garantias.map((g, i) => {
                const st = ESTADO_GAR[g.estado] ?? ESTADO_GAR.retenida
                const dias = diasParaVencer(g.fecha_vencimiento)
                const alerta = g.estado !== 'recuperada' && dias <= 30
                return (
                  <div key={g.id} style={{ padding: '13px 16px', borderBottom: i < garantias.length - 1 ? '0.5px solid #f4f6f8' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>{TIPO_GARANTIA[g.tipo] ?? g.tipo}</span>
                          {alerta && (
                            <span style={{ fontSize: 10, color: dias < 0 ? '#a32d2d' : '#854f0b' }}>
                              <IconAlertTriangle size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                              {dias < 0 ? 'Vencida' : `Vence en ${dias}d`}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                          Vencimiento: {formatFecha(g.fecha_vencimiento)} · {g.porcentaje}%
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1d1e' }}>{formatMonto(Number(g.monto))}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 999, backgroundColor: st.bg, color: st.color, flexShrink: 0 }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      {g.estado === 'retenida' && (
                        <button onClick={() => handleEstadoGarantia(g.id, 'en_gestion')} style={{ fontSize: 11, padding: '3px 10px', backgroundColor: '#e0f4fc', color: '#0c6a8c', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
                          Iniciar gestion
                        </button>
                      )}
                      {g.estado === 'en_gestion' && (
                        <button onClick={() => handleEstadoGarantia(g.id, 'recuperada')} style={{ fontSize: 11, padding: '3px 10px', backgroundColor: '#eaf3de', color: '#3b6d11', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
                          Marcar recuperada
                        </button>
                      )}
                      <button onClick={() => handleDeleteGarantia(g.id)} style={{ fontSize: 11, padding: '3px 10px', color: '#a32d2d', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
