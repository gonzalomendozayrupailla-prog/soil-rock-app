'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { IconPlus, IconX, IconPlayerPause, IconPlayerPlay, IconRocket, IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { usePuede } from '@/app/lib/session-context'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Oportunidad {
  id: string
  codigo: string
  nombre: string
  fase: string
  sector: string
  moneda: string
  monto_contrato: number
  created_at: string
  cliente: { razon_social: string }
}

interface Perdida {
  id: string
  codigo: string
  nombre: string
  sector: string
  moneda: string
  monto_contrato: number
  created_at: string
  cliente: { razon_social: string }
  motivo_perdida: string | null
  fecha_perdida: string
}

interface Cliente {
  id: string
  razon_social: string
}

interface Contacto {
  id: string
  nombre: string
  cargo: string
  email: string
  telefono: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNAS = [
  { fase: 'pre_proyecto', label: 'Contacto',           color: '#6b7280' },
  { fase: 'propuesta',    label: 'Propuesta enviada',  color: '#0c6a8c' },
  { fase: 'negociacion',  label: 'Negociación',        color: '#854f0b' },

] as const

const SECTORES = ['Minería', 'Construcción', 'Energía', 'Oil & Gas', 'Infraestructura', 'Industria', 'Gobierno', 'Otro']

function diasDesde(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function formatMonto(n: number, moneda = 'PEN') {
  const simbolo = moneda === 'USD' ? 'US$' : 'S/'
  return `${simbolo} ${n.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`
}

function montoLabel(n: number, moneda = 'PEN') {
  return n > 0 ? formatMonto(n, moneda) : 'Por definir'
}

// ─── Card ────────────────────────────────────────────────────────────────────

function KanbanCard({
  op,
  onFaseChange,
  onCardClick,
  loading,
}: {
  op: Oportunidad
  onFaseChange: (id: string, fase: string, monto?: number) => void
  onCardClick: (id: string) => void
  loading: string | null
}) {
  const [showMontoInput, setShowMontoInput] = useState(false)
  const [montoInput, setMontoInput] = useState('')
  const verMontos = usePuede('ver_montos')
  const dias = diasDesde(op.created_at)
  const busy = loading === op.id

  function handleConvertir() {
    const m = parseFloat(montoInput)
    if (!m || m <= 0) return
    onFaseChange(op.id, 'ejecucion', m)
    setShowMontoInput(false)
  }

  return (
    <div
      onClick={() => onCardClick(op.id)}
      style={{
        backgroundColor: '#ffffff',
        border: '0.5px solid #e8eaed',
        borderRadius: 10,
        padding: '14px 14px 12px',
        marginBottom: 8,
        opacity: busy ? 0.6 : 1,
        transition: 'opacity 0.15s',
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: 11, color: '#b0b7c3', fontFamily: 'monospace', marginBottom: 4 }}>
        {op.codigo}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e', marginBottom: 2, lineHeight: 1.35 }}>
        {op.nombre}
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
        {op.cliente.razon_social}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: '#5b5b5b', backgroundColor: '#f4f6f8', padding: '2px 7px', borderRadius: 999 }}>
          {op.sector}
        </span>
        {verMontos && (
          <span style={{ fontSize: 11, color: op.monto_contrato > 0 ? '#5b5b5b' : '#9ca3af', backgroundColor: '#f4f6f8', padding: '2px 7px', borderRadius: 999 }}>
            {montoLabel(op.monto_contrato, op.moneda)}
          </span>
        )}
        <span style={{ fontSize: 11, color: '#9ca3af', backgroundColor: '#f4f6f8', padding: '2px 7px', borderRadius: 999 }}>
          {dias === 0 ? 'Hoy' : `${dias}d`}
        </span>
      </div>

      {/* Acciones por columna */}
      {op.fase === 'negociacion' && (
        <button
          onClick={(e) => { e.stopPropagation(); onFaseChange(op.id, 'en_pausa') }}
          disabled={busy}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 500,
            color: '#854f0b', backgroundColor: '#faeeda',
            border: 'none', borderRadius: 6,
            padding: '5px 10px', cursor: 'pointer', width: '100%',
            justifyContent: 'center',
          }}
        >
          <IconPlayerPause size={13} />
          En pausa
        </button>
      )}

      {op.fase === 'adjudicado' && (
        showMontoInput ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type="number"
              min="0"
              step="0.01"
              autoFocus
              placeholder={`Monto del contrato (${op.moneda === 'USD' ? 'US$' : 'S/'})`}
              value={montoInput}
              onChange={(e) => setMontoInput(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px', fontSize: 12,
                border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleConvertir}
                disabled={!montoInput || parseFloat(montoInput) <= 0}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  fontSize: 12, fontWeight: 500,
                  color: '#ffffff', backgroundColor: '#004aad',
                  border: 'none', borderRadius: 6,
                  padding: '5px 8px', cursor: 'pointer',
                  opacity: (!montoInput || parseFloat(montoInput) <= 0) ? 0.5 : 1,
                }}
              >
                <IconRocket size={13} />
                Confirmar
              </button>
              <button
                onClick={() => { setShowMontoInput(false); setMontoInput('') }}
                style={{
                  padding: '5px 10px', fontSize: 12, color: '#6b7280',
                  border: '0.5px solid #e8eaed', borderRadius: 6,
                  background: 'none', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (op.monto_contrato > 0) {
                onFaseChange(op.id, 'ejecucion')
              } else {
                setShowMontoInput(true)
              }
            }}
            disabled={busy}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 500,
              color: '#ffffff', backgroundColor: '#004aad',
              border: 'none', borderRadius: 6,
              padding: '5px 10px', cursor: 'pointer', width: '100%',
              justifyContent: 'center',
            }}
          >
            <IconRocket size={13} />
            Convertir a proyecto
          </button>
        )
      )}
    </div>
  )
}

// ─── Nueva Oportunidad Modal ──────────────────────────────────────────────────

function NuevaOportunidadModal({
  clientes,
  onClose,
  onCreated,
  onClienteCreado,
}: {
  clientes: Cliente[]
  onClose: () => void
  onCreated: (op: Oportunidad) => void
  onClienteCreado: (c: Cliente) => void
}) {
  const [clientesList, setClientesList] = useState<Cliente[]>(clientes)
  const [showNuevoCliente, setShowNuevoCliente] = useState(false)
  const [nuevoClienteForm, setNuevoClienteForm] = useState({ razon_social: '', ruc: '', sector: '', direccion: '' })
  const [savingCliente, setSavingCliente] = useState(false)
  const [clienteError, setClienteError] = useState('')

  const [contactosList, setContactosList] = useState<Contacto[]>([])
  const [loadingContactos, setLoadingContactos] = useState(false)
  const [contacto_id, setContacto_id] = useState('')
  const [showNuevoContacto, setShowNuevoContacto] = useState(false)
  const [nuevoContactoForm, setNuevoContactoForm] = useState({ nombre: '', cargo: '', email: '', telefono: '' })
  const [savingContacto, setSavingContacto] = useState(false)
  const [contactoError, setContactoError] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    cliente_id: '',
    sector: '',
    moneda: 'PEN',
    monto_contrato: '',
    fecha_inicio: new Date().toISOString().slice(0, 10),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function setNuevo(k: string, v: string) {
    setNuevoClienteForm((p) => ({ ...p, [k]: v }))
  }

  async function fetchContactos(clienteId: string) {
    setLoadingContactos(true)
    setContactosList([])
    setContacto_id('')
    setShowNuevoContacto(false)
    try {
      const res = await fetch(`/api/clientes/${clienteId}`)
      if (res.ok) {
        const data = await res.json()
        setContactosList(data.contactos ?? [])
      }
    } catch {
      // silently ignore — contactos queda vacío
    } finally {
      setLoadingContactos(false)
    }
  }

  async function handleGuardarContacto() {
    const { nombre, cargo, email, telefono } = nuevoContactoForm
    if (!nombre || !cargo || !email || !telefono) {
      setContactoError('Completa todos los campos del contacto')
      return
    }
    setSavingContacto(true)
    setContactoError('')
    try {
      const res = await fetch(`/api/clientes/${form.cliente_id}/contactos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, cargo, email, telefono }),
      })
      if (res.ok) {
        const c = await res.json()
        setContactosList((prev) => [...prev, c])
        setContacto_id(c.id)
        setShowNuevoContacto(false)
        setNuevoContactoForm({ nombre: '', cargo: '', email: '', telefono: '' })
      } else {
        const d = await res.json()
        setContactoError(d.error ?? 'Error al agregar contacto')
      }
    } catch {
      setContactoError('Error de conexión')
    } finally {
      setSavingContacto(false)
    }
  }

  async function handleGuardarCliente() {
    const { razon_social, ruc, sector, direccion } = nuevoClienteForm
    if (!razon_social || !ruc || !sector) {
      setClienteError('Completa los campos requeridos del cliente')
      return
    }
    setSavingCliente(true)
    setClienteError('')
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razon_social, ruc, sector, direccion: direccion || null }),
      })
      if (res.ok) {
        const c = await res.json()
        const nuevo: Cliente = { id: c.id, razon_social: c.razon_social }
        const updated = [...clientesList, nuevo].sort((a, b) =>
          a.razon_social.localeCompare(b.razon_social)
        )
        setClientesList(updated)
        setForm((p) => ({ ...p, cliente_id: c.id }))
        setShowNuevoCliente(false)
        setNuevoClienteForm({ razon_social: '', ruc: '', sector: '', direccion: '' })
        setContactosList([])
        setContacto_id('')
        setShowNuevoContacto(false)
        onClienteCreado(nuevo)
      } else {
        const d = await res.json()
        setClienteError(d.error ?? 'Error al crear cliente')
      }
    } catch {
      setClienteError('Error de conexión')
    } finally {
      setSavingCliente(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.cliente_id) {
      setError('Selecciona o crea un cliente')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monto_contrato: form.monto_contrato ? parseFloat(form.monto_contrato) : 0,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const clienteEncontrado = clientesList.find((c) => c.id === form.cliente_id)
        onCreated({
          id: data.id,
          codigo: data.codigo,
          nombre: data.nombre,
          fase: data.fase,
          sector: data.sector,
          moneda: data.moneda ?? 'PEN',
          monto_contrato: Number(data.monto_contrato),
          created_at: data.created_at,
          cliente: { razon_social: clienteEncontrado?.razon_social ?? '' },
        })
        onClose()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Error al crear')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 13,
    border: '0.5px solid #e8eaed',
    borderRadius: 7,
    outline: 'none',
    color: '#1a1d1e',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: '#5b5b5b',
    marginBottom: 4,
    display: 'block',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: 28,
          width: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: '#1a1d1e', margin: 0 }}>
            Nueva oportunidad
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
          >
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nombre */}
          <div>
            <label style={labelStyle}>
              Nombre de la oportunidad <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              required
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Ej. Estudio geotécnico planta Norte"
              style={inputStyle}
            />
          </div>

          {/* Cliente */}
          <div>
            <label style={labelStyle}>
              Cliente <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={showNuevoCliente ? '__new__' : form.cliente_id}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setShowNuevoCliente(true)
                  setForm((p) => ({ ...p, cliente_id: '' }))
                  setContactosList([])
                  setContacto_id('')
                  setShowNuevoContacto(false)
                } else {
                  setShowNuevoCliente(false)
                  set('cliente_id', e.target.value)
                  if (e.target.value) fetchContactos(e.target.value)
                  else { setContactosList([]); setContacto_id('') }
                }
              }}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Seleccionar cliente...</option>
              {clientesList.map((c) => (
                <option key={c.id} value={c.id}>{c.razon_social}</option>
              ))}
              <option value="__new__">+ Crear nuevo cliente</option>
            </select>

            {/* Formulario inline de nuevo cliente */}
            {showNuevoCliente && (
              <div
                style={{
                  marginTop: 10,
                  padding: 14,
                  backgroundColor: '#f9fafb',
                  border: '0.5px solid #e8eaed',
                  borderRadius: 8,
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 600, color: '#1a1d1e', margin: '0 0 10px' }}>
                  Nuevo cliente
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    value={nuevoClienteForm.razon_social}
                    onChange={(e) => setNuevo('razon_social', e.target.value)}
                    placeholder="Razón social *"
                    style={inputStyle}
                  />
                  <input
                    value={nuevoClienteForm.ruc}
                    onChange={(e) => setNuevo('ruc', e.target.value)}
                    placeholder="RUC *"
                    style={inputStyle}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <select
                      value={nuevoClienteForm.sector}
                      onChange={(e) => setNuevo('sector', e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">Sector *</option>
                      {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input
                      value={nuevoClienteForm.direccion}
                      onChange={(e) => setNuevo('direccion', e.target.value)}
                      placeholder="Dirección (opcional)"
                      style={inputStyle}
                    />
                  </div>
                  {clienteError && (
                    <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{clienteError}</p>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleGuardarCliente}
                      disabled={savingCliente}
                      style={{
                        flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 500,
                        color: '#ffffff', backgroundColor: '#1a1d1e',
                        border: 'none', borderRadius: 6,
                        cursor: savingCliente ? 'not-allowed' : 'pointer',
                        opacity: savingCliente ? 0.6 : 1,
                      }}
                    >
                      {savingCliente ? 'Guardando...' : 'Guardar cliente'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNuevoCliente(false)
                        setNuevoClienteForm({ razon_social: '', ruc: '', sector: '', direccion: '' })
                        setClienteError('')
                      }}
                      style={{
                        padding: '7px 12px', fontSize: 12, color: '#6b7280',
                        border: '0.5px solid #e8eaed', borderRadius: 6,
                        background: 'none', cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contacto */}
          {form.cliente_id && !showNuevoCliente && (
            <div>
              <label style={labelStyle}>Contacto</label>
              {loadingContactos ? (
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Cargando contactos...</p>
              ) : (
                <>
                  <select
                    value={showNuevoContacto ? '__new__' : contacto_id}
                    onChange={(e) => {
                      if (e.target.value === '__new__') {
                        setShowNuevoContacto(true)
                        setContacto_id('')
                      } else {
                        setShowNuevoContacto(false)
                        setContacto_id(e.target.value)
                      }
                    }}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">
                      {contactosList.length === 0 ? 'Sin contactos registrados' : 'Seleccionar contacto...'}
                    </option>
                    {contactosList.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre} — {c.cargo}</option>
                    ))}
                    <option value="__new__">+ Agregar contacto</option>
                  </select>

                  {showNuevoContacto && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: 14,
                        backgroundColor: '#f9fafb',
                        border: '0.5px solid #e8eaed',
                        borderRadius: 8,
                      }}
                    >
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#1a1d1e', margin: '0 0 10px' }}>
                        Nuevo contacto
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input
                            value={nuevoContactoForm.nombre}
                            onChange={(e) => setNuevoContactoForm((p) => ({ ...p, nombre: e.target.value }))}
                            placeholder="Nombre *"
                            style={inputStyle}
                          />
                          <input
                            value={nuevoContactoForm.cargo}
                            onChange={(e) => setNuevoContactoForm((p) => ({ ...p, cargo: e.target.value }))}
                            placeholder="Cargo *"
                            style={inputStyle}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <input
                            type="email"
                            value={nuevoContactoForm.email}
                            onChange={(e) => setNuevoContactoForm((p) => ({ ...p, email: e.target.value }))}
                            placeholder="Email *"
                            style={inputStyle}
                          />
                          <input
                            value={nuevoContactoForm.telefono}
                            onChange={(e) => setNuevoContactoForm((p) => ({ ...p, telefono: e.target.value }))}
                            placeholder="Teléfono *"
                            style={inputStyle}
                          />
                        </div>
                        {contactoError && (
                          <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{contactoError}</p>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={handleGuardarContacto}
                            disabled={savingContacto}
                            style={{
                              flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 500,
                              color: '#ffffff', backgroundColor: '#1a1d1e',
                              border: 'none', borderRadius: 6,
                              cursor: savingContacto ? 'not-allowed' : 'pointer',
                              opacity: savingContacto ? 0.6 : 1,
                            }}
                          >
                            {savingContacto ? 'Guardando...' : 'Guardar contacto'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNuevoContacto(false)
                              setNuevoContactoForm({ nombre: '', cargo: '', email: '', telefono: '' })
                              setContactoError('')
                            }}
                            style={{
                              padding: '7px 12px', fontSize: 12, color: '#6b7280',
                              border: '0.5px solid #e8eaed', borderRadius: 6,
                              background: 'none', cursor: 'pointer',
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Sector, Moneda y Monto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Sector <span style={{ color: '#ef4444' }}>*</span></label>
              <select
                required
                value={form.sector}
                onChange={(e) => set('sector', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Seleccionar...</option>
                {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Moneda</label>
              <select
                value={form.moneda}
                onChange={(e) => set('moneda', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="PEN">S/ PEN</option>
                <option value="USD">US$ USD</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Monto estimado</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.monto_contrato}
                onChange={(e) => set('monto_contrato', e.target.value)}
                placeholder="Se definirá al adjudicar"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label style={labelStyle}>Fecha de inicio <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              required
              type="date"
              value={form.fecha_inicio}
              onChange={(e) => set('fecha_inicio', e.target.value)}
              style={inputStyle}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, backgroundColor: '#004aad', color: '#ffffff',
                border: 'none', borderRadius: 7,
                padding: '9px 0', fontSize: 13, fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Creando...' : 'Crear oportunidad'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px', fontSize: 13, color: '#6b7280',
                border: '0.5px solid #e8eaed', borderRadius: 7,
                background: 'none', cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function PipelineView({
  oportunidades: inicial,
  clientes,
  perdidas: perdidasIniciales,
}: {
  oportunidades: Oportunidad[]
  clientes: Cliente[]
  perdidas: Perdida[]
}) {
  const router = useRouter()
  const verMontos = usePuede('ver_montos')
  const [ops, setOps] = useState<Oportunidad[]>(inicial)
  const [localClientes, setLocalClientes] = useState<Cliente[]>(clientes)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [perdidas, setPerdidas] = useState<Perdida[]>(perdidasIniciales)
  const [showPerdidas, setShowPerdidas] = useState(false)
  const [, startTransition] = useTransition()

  async function cambiarFase(id: string, fase: string, monto?: number) {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/pipeline/${id}/fase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fase,
          ...(monto !== undefined ? { monto_contrato: monto } : {}),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (fase === 'ejecucion') {
          setOps((prev) => prev.filter((o) => o.id !== id))
          startTransition(() => router.push(`/dashboard/proyectos/${data.id}`))
        } else {
          setOps((prev) => prev.map((o) => o.id === id ? { ...o, fase } : o))
        }
      }
    } finally {
      setLoadingId(null)
    }
  }

  function reactivar(id: string) {
    cambiarFase(id, 'negociacion')
  }

  async function reabrirPerdida(p: Perdida) {
    setLoadingId(p.id)
    try {
      const res = await fetch(`/api/pipeline/${p.id}/fase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fase: 'negociacion' }),
      })
      if (res.ok) {
        setPerdidas((prev) => prev.filter((x) => x.id !== p.id))
        setOps((prev) => [
          ...prev,
          {
            id: p.id,
            codigo: p.codigo,
            nombre: p.nombre,
            fase: 'negociacion',
            sector: p.sector,
            monto_contrato: p.monto_contrato,
            moneda: p.moneda,
            created_at: p.created_at,
            cliente: p.cliente,
          },
        ])
      }
    } finally {
      setLoadingId(null)
    }
  }

  function onCreated(op: Oportunidad) {
    setOps((prev) => [op, ...prev])
  }

  function onClienteCreado(c: Cliente) {
    setLocalClientes((prev) =>
      [...prev, c].sort((a, b) => a.razon_social.localeCompare(b.razon_social))
    )
  }

  const activas = ops.filter((o) => o.fase !== 'en_pausa')
  const enPausa  = ops.filter((o) => o.fase === 'en_pausa')

  const totalMonto = activas.reduce((s, o) => s + o.monto_contrato, 0)

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: '#1a1d1e', margin: 0 }}>Pipeline</h1>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '3px 0 0' }}>
            {activas.length} oportunidad{activas.length !== 1 ? 'es' : ''} activa{activas.length !== 1 ? 's' : ''}
            {verMontos && totalMonto > 0 && ` · ${formatMonto(totalMonto)} en juego`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            backgroundColor: '#004aad', color: '#ffffff',
            border: 'none', borderRadius: 7,
            padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <IconPlus size={14} />
          Nueva oportunidad
        </button>
      </div>

      {/* Kanban */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'start' }}>
        {COLUMNAS.map(({ fase, label, color }) => {
          const cards = activas.filter((o) => o.fase === fase)
          const montoCol = cards.reduce((s, o) => s + o.monto_contrato, 0)
          return (
            <div key={fase}>
              {/* Column Header */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 10,
                  paddingBottom: 10,
                  borderBottom: `2px solid ${color}22`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: color, flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1d1e' }}>{label}</span>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 500,
                      backgroundColor: '#f4f6f8', color: '#6b7280',
                      padding: '1px 6px', borderRadius: 999,
                    }}
                  >
                    {cards.length}
                  </span>
                </div>
                {verMontos && montoCol > 0 && (
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>
                    {formatMonto(montoCol)}
                  </span>
                )}
              </div>

              {/* Cards */}
              <div>
                {cards.length === 0 ? (
                  <div
                    style={{
                      border: '1px dashed #e8eaed', borderRadius: 10,
                      padding: '20px 0', textAlign: 'center',
                      fontSize: 12, color: '#d1d5db',
                    }}
                  >
                    Sin oportunidades
                  </div>
                ) : (
                  cards.map((op) => (
                    <KanbanCard
                      key={op.id}
                      op={op}
                      onFaseChange={cambiarFase}
                      onCardClick={(id) => router.push(`/dashboard/pipeline/${id}`)}
                      loading={loadingId}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* En pausa */}
      {enPausa.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>En pausa</span>
            <span
              style={{
                fontSize: 11, fontWeight: 500,
                backgroundColor: '#f4f6f8', color: '#9ca3af',
                padding: '1px 7px', borderRadius: 999,
              }}
            >
              {enPausa.length}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {enPausa.map((op) => {
              const dias = diasDesde(op.created_at)
              const busy = loadingId === op.id
              return (
                <div
                  key={op.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '0.5px solid #e8eaed',
                    borderRadius: 10,
                    padding: '14px 14px 12px',
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  <div style={{ fontSize: 11, color: '#b0b7c3', fontFamily: 'monospace', marginBottom: 4 }}>
                    {op.codigo}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginBottom: 2 }}>
                    {op.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>
                    {op.cliente.razon_social}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', backgroundColor: '#f4f6f8', padding: '2px 7px', borderRadius: 999 }}>
                      {op.sector}
                    </span>
                    {verMontos && (
                      <span style={{ fontSize: 11, color: '#9ca3af', backgroundColor: '#f4f6f8', padding: '2px 7px', borderRadius: 999 }}>
                        {montoLabel(op.monto_contrato, op.moneda)}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: '#9ca3af', backgroundColor: '#f4f6f8', padding: '2px 7px', borderRadius: 999 }}>
                      {dias === 0 ? 'Hoy' : `${dias}d`}
                    </span>
                  </div>
                  <button
                    onClick={() => reactivar(op.id)}
                    disabled={busy}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 12, fontWeight: 500,
                      color: '#3b6d11', backgroundColor: '#eaf3de',
                      border: 'none', borderRadius: 6,
                      padding: '5px 10px', cursor: 'pointer', width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    <IconPlayerPlay size={13} />
                    Reactivar
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Perdidas */}
      {perdidas.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <button
            onClick={() => setShowPerdidas((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12,
            }}
          >
            {showPerdidas ? <IconChevronDown size={14} color="#9ca3af" /> : <IconChevronRight size={14} color="#9ca3af" />}
            <span style={{ fontSize: 13, fontWeight: 600, color: '#a32d2d' }}>Perdidas</span>
            <span
              style={{
                fontSize: 11, fontWeight: 500,
                backgroundColor: '#fcebeb', color: '#a32d2d',
                padding: '1px 7px', borderRadius: 999,
              }}
            >
              {perdidas.length}
            </span>
          </button>

          {showPerdidas && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {perdidas.map((p) => {
                const busy = loadingId === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/dashboard/pipeline/${p.id}`)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 180px 180px 1fr auto',
                      gap: 16,
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      border: '0.5px solid #f5d0d0',
                      borderRadius: 8,
                      padding: '12px 16px',
                      cursor: 'pointer',
                      opacity: busy ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#fdf9f9' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#ffffff' }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: '#b0b7c3', fontFamily: 'monospace', marginBottom: 2 }}>{p.codigo}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#6b7280' }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{p.cliente.razon_social}</div>
                    </div>
                    {verMontos && (
                      <div>
                        <div style={{ fontSize: 11, color: '#b0b7c3', marginBottom: 2 }}>Monto estimado</div>
                        <div style={{ fontSize: 13, color: p.monto_contrato > 0 ? '#6b7280' : '#b0b7c3' }}>
                          {p.monto_contrato > 0 ? formatMonto(p.monto_contrato, p.moneda) : 'Por definir'}
                        </div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 11, color: '#b0b7c3', marginBottom: 2 }}>Motivo</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{p.motivo_perdida ?? '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#b0b7c3', marginBottom: 2 }}>Fecha</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {new Date(p.fecha_perdida).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); reabrirPerdida(p) }}
                      disabled={busy}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 500,
                        color: '#854f0b', backgroundColor: '#faeeda',
                        border: 'none', borderRadius: 6,
                        padding: '5px 10px', cursor: busy ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <IconPlayerPlay size={12} />
                      Reabrir
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <NuevaOportunidadModal
          clientes={localClientes}
          onClose={() => setShowModal(false)}
          onCreated={onCreated}
          onClienteCreado={onClienteCreado}
        />
      )}
    </div>
  )
}
