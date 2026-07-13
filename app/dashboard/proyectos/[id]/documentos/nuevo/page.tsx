'use client'

import { useState, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const TIPOS_COMUNES = [
  'Propuesta técnica',
  'Propuesta económica',
  'Contrato',
  'Addenda',
  'Informe de campo',
  'Informe técnico',
  'Plano',
  'Memoria descriptiva',
  'Certificado',
  'Otro',
]

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp'
const MAX_MB = 50

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ESTADOS_CLIENTE = [
  { value: 'pendiente_revision', label: 'Pendiente revisión' },
  { value: 'revisado', label: 'Revisado' },
]

const ESTADOS_INTERNO = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviado_cliente', label: 'Enviado a cliente' },
  { value: 'con_observaciones', label: 'Con observaciones' },
  { value: 'aprobado', label: 'Aprobado' },
]

type Origen = 'cliente' | 'interno' | null
type UploadStep = 'idle' | 'presigning' | 'uploading' | 'saving'

export default function NuevoDocumentoPage() {
  const router = useRouter()
  const { id: proyectoId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? 'proyectos'
  const backHref = from === 'pipeline'
    ? `/dashboard/pipeline/${proyectoId}`
    : `/dashboard/proyectos/${proyectoId}`

  const [origen, setOrigen] = useState<Origen>(null)
  const [step, setStep] = useState<UploadStep>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [archivoInfo, setArchivoInfo] = useState<{ name: string; size: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const esInterno = origen === 'interno'
  const estadosDisponibles = esInterno ? ESTADOS_INTERNO : ESTADOS_CLIENTE
  const estadoDefault = esInterno ? 'borrador' : 'pendiente_revision'

  const [form, setForm] = useState({
    nombre: '',
    tipo: '',
    version: 'v1.0',
    estado: estadoDefault,
  })

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleOrigenChange(o: Origen) {
    setOrigen(o)
    setForm((prev) => ({
      ...prev,
      estado: o === 'interno' ? 'borrador' : 'pendiente_revision',
    }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setArchivoInfo(null); return }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`El archivo supera el límite de ${MAX_MB}MB`)
      e.target.value = ''
      setArchivoInfo(null)
      return
    }
    setError('')
    setArchivoInfo({ name: file.name, size: file.size })
    if (!form.nombre) setField('nombre', file.name.replace(/\.[^/.]+$/, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) { setError('Selecciona un archivo'); return }
    if (!origen) { setError('Indica el origen del documento'); return }

    setError('')
    setProgress(0)

    try {
      // Paso 1 — pedir URL firmada al servidor
      setStep('presigning')
      const presignRes = await fetch('/api/documentos/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, proyectoId }),
      })
      if (!presignRes.ok) {
        const d = await presignRes.json()
        setError(d.error ?? 'Error al iniciar subida')
        setStep('idle')
        return
      }
      const { signedUrl, path } = await presignRes.json()

      // Paso 2 — subir archivo directo a Supabase con progreso real
      setStep('uploading')
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Error al subir archivo (${xhr.status})`))
        }
        xhr.onerror = () => reject(new Error('Error de conexión durante la subida'))
        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
        xhr.send(file)
      })
      setProgress(100)

      // Paso 3 — registrar metadatos en la BD
      setStep('saving')
      const metaRes = await fetch(`/api/proyectos/${proyectoId}/documentos/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          nombre: form.nombre,
          tipo: form.tipo,
          version: form.version,
          es_interno: esInterno,
          estado: form.estado,
        }),
      })
      if (!metaRes.ok) {
        const d = await metaRes.json()
        setError(d.error ?? 'Error al guardar el documento')
        setStep('idle')
        return
      }

      router.push(backHref)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setStep('idle')
      setProgress(0)
    }
  }

  const loading = step !== 'idle'

  const STEP_LABEL: Record<UploadStep, string> = {
    idle:      'Subir documento',
    presigning:'Preparando...',
    uploading: `Subiendo ${progress}%`,
    saving:    'Guardando...',
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    fontSize: 13,
    border: '0.5px solid #e8eaed',
    borderRadius: 7,
    outline: 'none',
    color: '#1a1d1e',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    fontSize: 12,
    fontWeight: 500 as const,
    color: '#5b5b5b',
    marginBottom: 4,
    display: 'block' as const,
  }

  return (
    <div style={{ padding: 28, maxWidth: 640 }}>
      <div style={{ marginBottom: 20 }}>
        <Link
          href={backHref}
          style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none', display: 'inline-block', marginBottom: 8 }}
        >
          ← Volver
        </Link>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: '#1a1d1e', margin: 0 }}>
          Subir documento
        </h1>
      </div>

      <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Origen */}
          <div>
            <label style={{ ...labelStyle, marginBottom: 10 }}>
              ¿Este documento es del cliente o de Soil Rock? <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {([
                { key: 'cliente', label: 'Del cliente', sub: 'Documentos que nos envían' },
                { key: 'interno', label: 'De Soil Rock', sub: 'Documentos que producimos' },
              ] as const).map(({ key, label, sub }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleOrigenChange(key)}
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 8,
                    border: origen === key ? '1.5px solid #004aad' : '0.5px solid #e8eaed',
                    backgroundColor: origen === key ? '#f0f5ff' : '#ffffff',
                    cursor: 'pointer', textAlign: 'left' as const,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: origen === key ? '#004aad' : '#1a1d1e', marginBottom: 2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {origen && (
            <>
              {/* Archivo */}
              <div>
                <label style={labelStyle}>
                  Archivo <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div
                  onClick={() => !loading && fileRef.current?.click()}
                  style={{
                    border: '1.5px dashed #e8eaed', borderRadius: 8, padding: '28px 20px',
                    textAlign: 'center' as const, cursor: loading ? 'default' : 'pointer',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPT}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  {archivoInfo ? (
                    <>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e' }}>{archivoInfo.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{formatBytes(archivoInfo.size)}</div>
                      {!loading && <div style={{ fontSize: 12, color: '#b0b7c3', marginTop: 4 }}>Clic para cambiar</div>}
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 13, color: '#5b5b5b' }}>Haz clic para seleccionar archivo</div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                        PDF, Word, Excel, imágenes — máx. {MAX_MB}MB
                      </div>
                    </>
                  )}
                </div>

                {/* Barra de progreso */}
                {step === 'uploading' && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                      <span>Subiendo archivo...</span>
                      <span>{progress}%</span>
                    </div>
                    <div style={{ height: 4, backgroundColor: '#e8eaed', borderRadius: 2, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%', borderRadius: 2, backgroundColor: '#004aad',
                          width: `${progress}%`, transition: 'width 0.15s ease',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Nombre */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="nombre" style={labelStyle}>
                    Nombre del documento <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setField('nombre', e.target.value)}
                    style={inputStyle}
                    disabled={loading}
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label htmlFor="tipo" style={labelStyle}>
                    Tipo <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="tipo"
                    type="text"
                    required
                    list="tipos-list"
                    placeholder="Selecciona o escribe..."
                    value={form.tipo}
                    onChange={(e) => setField('tipo', e.target.value)}
                    style={inputStyle}
                    disabled={loading}
                  />
                  <datalist id="tipos-list">
                    {TIPOS_COMUNES.map((t) => <option key={t} value={t} />)}
                  </datalist>
                </div>

                {/* Versión */}
                <div>
                  <label htmlFor="version" style={labelStyle}>
                    Versión <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="version"
                    type="text"
                    required
                    value={form.version}
                    onChange={(e) => setField('version', e.target.value)}
                    style={inputStyle}
                    disabled={loading}
                  />
                </div>

                {/* Estado */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="estado" style={labelStyle}>Estado inicial</label>
                  <select
                    id="estado"
                    value={form.estado}
                    onChange={(e) => setField('estado', e.target.value)}
                    style={{ ...inputStyle, cursor: loading ? 'default' : 'pointer' }}
                    disabled={loading}
                  >
                    {estadosDisponibles.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: '#004aad', color: '#ffffff',
                    padding: '8px 20px', borderRadius: 7,
                    fontSize: 13, fontWeight: 500, border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    minWidth: 140,
                  }}
                >
                  {STEP_LABEL[step]}
                </button>
                {!loading && (
                  <Link href={backHref} style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}>
                    Cancelar
                  </Link>
                )}
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
