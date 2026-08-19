'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  IconPlus, IconX, IconFileText, IconDownload, IconTrash, IconUpload,
} from '@tabler/icons-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocSubido { nombre: string }

interface Documento {
  id: string
  nombre: string
  tipo: string
  version: string
  estado: string
  url: string
  fecha_subida: string
  subido: DocSubido
}

interface Carpeta {
  id: string
  nombre: string
  modulo: string
  documentos: Documento[]
}

type UploadStep = 'idle' | 'presigning' | 'uploading' | 'saving'

const ESTADOS_DOC = [
  { value: 'borrador',            label: 'Borrador' },
  { value: 'pendiente_revision',  label: 'Pendiente revisión' },
  { value: 'enviado_cliente',     label: 'Enviado al cliente' },
  { value: 'con_observaciones',   label: 'Con observaciones' },
  { value: 'aprobado',            label: 'Aprobado' },
  { value: 'revisado',            label: 'Revisado' },
]

const ESTADO_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  borrador:           { backgroundColor: '#f4f6f8', color: '#6b7280' },
  enviado_cliente:    { backgroundColor: '#e0f4fc', color: '#0c6a8c' },
  con_observaciones:  { backgroundColor: '#faeeda', color: '#854f0b' },
  aprobado:           { backgroundColor: '#eaf3de', color: '#3b6d11' },
  pendiente_revision: { backgroundColor: '#faeeda', color: '#854f0b' },
  revisado:           { backgroundColor: '#eaf3de', color: '#3b6d11' },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── TabIngenieria ────────────────────────────────────────────────────────────

export default function TabIngenieria({
  proyectoId,
}: {
  proyectoId: string
  proyectoCodigo?: string
  proyectoNombre?: string
}) {
  const [carpetas, setCarpetas] = useState<Carpeta[]>([])
  const [loading, setLoading] = useState(true)
  const [expandida, setExpandida] = useState<string | null>(null)
  const [showNuevaCarpeta, setShowNuevaCarpeta] = useState(false)
  const [nuevaNombre, setNuevaNombre] = useState('')
  const [creando, setCreando] = useState(false)
  const [confirmDelCarpeta, setConfirmDelCarpeta] = useState<string | null>(null)
  const [deletingCarpeta, setDeletingCarpeta] = useState<string | null>(null)
  const [confirmDelDoc, setConfirmDelDoc] = useState<string | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null)
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null)
  const [uploadCarpetaId, setUploadCarpetaId] = useState<string | null>(null)
  const [uploadForm, setUploadForm] = useState({ nombre: '', tipo: '', version: 'V00', estado: 'borrador' })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const uploading = uploadStep !== 'idle'

  const fetchCarpetas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/carpetas?modulo=ingenieria`)
      if (res.ok) setCarpetas(await res.json())
    } finally {
      setLoading(false)
    }
  }, [proyectoId])

  useEffect(() => { fetchCarpetas() }, [fetchCarpetas])

  async function handleCrearCarpeta() {
    if (!nuevaNombre.trim()) return
    setCreando(true)
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/carpetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevaNombre.trim(), modulo: 'ingenieria' }),
      })
      if (res.ok) {
        const nueva = await res.json()
        setCarpetas((prev) => [...prev, { ...nueva, documentos: [] }])
        setNuevaNombre(''); setShowNuevaCarpeta(false)
        setExpandida(nueva.id)
      }
    } finally {
      setCreando(false)
    }
  }

  async function handleDeleteCarpeta(id: string) {
    setDeletingCarpeta(id); setConfirmDelCarpeta(null)
    try {
      const res = await fetch(`/api/carpetas/${id}`, { method: 'DELETE' })
      if (res.ok) setCarpetas((prev) => prev.filter((c) => c.id !== id))
    } finally { setDeletingCarpeta(null) }
  }

  async function handleDownload(docId: string) {
    setDownloadingDoc(docId)
    try {
      const res = await fetch(`/api/documentos/${docId}/download`)
      if (res.ok) {
        const { url } = await res.json()
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } finally { setDownloadingDoc(null) }
  }

  async function handleDeleteDoc(docId: string, carpetaId: string) {
    setDeletingDoc(docId); setConfirmDelDoc(null)
    try {
      const res = await fetch(`/api/documentos/${docId}`, { method: 'DELETE' })
      if (res.ok) {
        setCarpetas((prev) => prev.map((c) =>
          c.id === carpetaId ? { ...c, documentos: c.documentos.filter((d) => d.id !== docId) } : c
        ))
      }
    } finally { setDeletingDoc(null) }
  }

  function startUpload(carpetaId: string) {
    setUploadCarpetaId(carpetaId)
    setUploadForm({ nombre: '', tipo: '', version: 'V00', estado: 'borrador' })
    setUploadFile(null); setUploadStep('idle')
    setUploadProgress(0); setUploadError('')
    setExpandida(carpetaId)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setUploadFile(null); return }
    setUploadFile(file)
    if (!uploadForm.nombre) setUploadForm((p) => ({ ...p, nombre: file.name.replace(/\.[^/.]+$/, '') }))
  }

  async function handleUpload() {
    if (!uploadFile || !uploadForm.nombre.trim() || !uploadForm.tipo.trim()) {
      setUploadError('Archivo, nombre y tipo son requeridos'); return
    }
    if (!uploadCarpetaId) return
    setUploadError(''); setUploadProgress(0)
    const carpetaId = uploadCarpetaId

    try {
      setUploadStep('presigning')
      const presignRes = await fetch('/api/documentos/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: uploadFile.name, proyectoId, fileSize: uploadFile.size }),
      })
      if (!presignRes.ok) {
        const d = await presignRes.json()
        setUploadError(d.error ?? 'Error al iniciar subida')
        setUploadStep('idle'); return
      }
      const { signedUrl, path } = await presignRes.json()

      setUploadStep('uploading')
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Error ${xhr.status}`))
        xhr.onerror = () => reject(new Error('Error de conexión'))
        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', uploadFile.type || 'application/octet-stream')
        xhr.send(uploadFile)
      })

      setUploadStep('saving')
      const metaRes = await fetch(`/api/proyectos/${proyectoId}/documentos/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path, nombre: uploadForm.nombre.trim(), tipo: uploadForm.tipo.trim(),
          version: uploadForm.version, es_interno: true,
          estado: uploadForm.estado, carpeta_id: carpetaId,
        }),
      })
      if (!metaRes.ok) {
        const d = await metaRes.json()
        setUploadError(d.error ?? 'Error al guardar')
        setUploadStep('idle'); return
      }
      const nuevoDoc = await metaRes.json()
      setCarpetas((prev) => prev.map((c) =>
        c.id === carpetaId ? { ...c, documentos: [nuevoDoc, ...c.documentos] } : c
      ))
      setUploadCarpetaId(null); setUploadStep('idle')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error inesperado')
      setUploadStep('idle')
    }
  }

  const inp: React.CSSProperties = {
    padding: '6px 10px', fontSize: 12,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none',
    boxSizing: 'border-box',
  }

  if (loading) return <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando...</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>Carpetas de ingeniería</span>
        {!showNuevaCarpeta ? (
          <button onClick={() => setShowNuevaCarpeta(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: '#004aad', padding: '6px 14px', borderRadius: 7, border: '0.5px solid #004aad', background: 'none', cursor: 'pointer' }}>
            <IconPlus size={13} /> Crear carpeta
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input autoFocus value={nuevaNombre} onChange={(e) => setNuevaNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCrearCarpeta()}
              placeholder="Nombre de la carpeta..."
              style={{ padding: '6px 10px', fontSize: 12, border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none', width: 200 }} />
            <button onClick={handleCrearCarpeta} disabled={!nuevaNombre.trim() || creando}
              style={{ fontSize: 12, padding: '6px 12px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              {creando ? '...' : 'Crear'}
            </button>
            <button onClick={() => { setShowNuevaCarpeta(false); setNuevaNombre('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={15} /></button>
          </div>
        )}
      </div>

      {/* Carpetas */}
      {carpetas.length === 0 ? (
        <div style={{ border: '1px dashed #e8eaed', borderRadius: 10, padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Sin carpetas. Crea la primera para organizar documentos de ingeniería.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {carpetas.map((carpeta) => {
            const abierta = expandida === carpeta.id
            const isDelC = deletingCarpeta === carpeta.id
            const confirmDelC = confirmDelCarpeta === carpeta.id
            const isEmpty = carpeta.documentos.length === 0

            return (
              <div key={carpeta.id} style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
                  <button onClick={() => setExpandida(abierta ? null : carpeta.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e' }}>{carpeta.nombre}</span>
                    <span style={{ fontSize: 11, color: '#b0b7c3' }}>{carpeta.documentos.length} docs</span>
                  </button>

                  {uploadCarpetaId !== carpeta.id && (
                    <button onClick={() => startUpload(carpeta.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: '#004aad', padding: '4px 10px', borderRadius: 5, border: '0.5px solid #004aad', background: 'none', cursor: 'pointer', flexShrink: 0 }}>
                      <IconUpload size={11} /> Subir
                    </button>
                  )}

                  {confirmDelC ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                      {isEmpty ? (
                        <>
                          <button onClick={() => handleDeleteCarpeta(carpeta.id)}
                            style={{ fontSize: 11, padding: '3px 8px', backgroundColor: '#a32d2d', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Eliminar</button>
                          <button onClick={() => setConfirmDelCarpeta(null)}
                            style={{ fontSize: 11, padding: '3px 8px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 5, background: 'none', cursor: 'pointer' }}>Cancelar</button>
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: '#a32d2d' }}>
                          Vacía primero
                          <button onClick={() => setConfirmDelCarpeta(null)} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>✕</button>
                        </span>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelCarpeta(carpeta.id)} disabled={isDelC}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '0.5px solid #e8eaed', color: '#9ca3af', background: 'none', cursor: 'pointer', flexShrink: 0 }}>
                      {isDelC ? '...' : <IconTrash size={12} />}
                    </button>
                  )}
                </div>

                {/* Upload form */}
                {uploadCarpetaId === carpeta.id && (
                  <div style={{ padding: '12px 16px', borderTop: '0.5px solid #f4f6f8', backgroundColor: '#f9fafb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#1a1d1e' }}>Subir documento en "{carpeta.nombre}"</span>
                      <button onClick={() => setUploadCarpetaId(null)} disabled={uploading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={14} /></button>
                    </div>

                    <div onClick={() => !uploading && fileRef.current?.click()}
                      style={{ border: '1.5px dashed #e8eaed', borderRadius: 8, padding: '14px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', backgroundColor: '#ffffff', marginBottom: 8 }}>
                      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} disabled={uploading} />
                      {uploadFile ? <span style={{ fontSize: 12, color: '#1a1d1e' }}>{uploadFile.name}</span>
                        : <span style={{ fontSize: 12, color: '#9ca3af' }}>Clic para seleccionar archivo</span>}
                    </div>

                    {uploadStep === 'uploading' && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ height: 4, backgroundColor: '#e8eaed', borderRadius: 2 }}>
                          <div style={{ height: 4, width: `${uploadProgress}%`, backgroundColor: '#004aad', borderRadius: 2, transition: 'width 0.15s' }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{uploadProgress}%</span>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Nombre *</label>
                        <input value={uploadForm.nombre} onChange={(e) => setUploadForm((p) => ({ ...p, nombre: e.target.value }))} style={{ ...inp, width: '100%' }} disabled={uploading} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Tipo *</label>
                        <input
                          list="tipos-ing-list"
                          value={uploadForm.tipo}
                          onChange={(e) => setUploadForm((p) => ({ ...p, tipo: e.target.value }))}
                          placeholder="Ej: Informe técnico"
                          style={{ ...inp, width: '100%' }}
                          disabled={uploading}
                        />
                        <datalist id="tipos-ing-list">
                          {['Informe técnico', 'Plano', 'Memoria descriptiva', 'Procedimiento', 'Protocolo', 'Certificado', 'Reporte', 'Otro'].map((t) => <option key={t} value={t} />)}
                        </datalist>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Versión</label>
                        <input value={uploadForm.version} onChange={(e) => setUploadForm((p) => ({ ...p, version: e.target.value }))} style={{ ...inp, width: '100%' }} disabled={uploading} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Estado</label>
                        <select value={uploadForm.estado} onChange={(e) => setUploadForm((p) => ({ ...p, estado: e.target.value }))} style={{ ...inp, width: '100%', cursor: 'pointer' }} disabled={uploading}>
                          {ESTADOS_DOC.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </div>
                    </div>

                    {uploadError && <p style={{ fontSize: 12, color: '#a32d2d', marginBottom: 8 }}>{uploadError}</p>}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleUpload} disabled={uploading}
                        style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                        {uploadStep === 'presigning' ? 'Preparando...'
                          : uploadStep === 'uploading' ? `Subiendo ${uploadProgress}%`
                          : uploadStep === 'saving' ? 'Guardando...'
                          : 'Subir'}
                      </button>
                      <button onClick={() => setUploadCarpetaId(null)} disabled={uploading}
                        style={{ fontSize: 12, padding: '6px 12px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                )}

                {/* Docs list */}
                {abierta && carpeta.documentos.map((doc) => {
                  const estadoStyle = ESTADO_STYLES[doc.estado] ?? { backgroundColor: '#f4f6f8', color: '#6b7280' }
                  const estadoLabel = ESTADOS_DOC.find((e) => e.value === doc.estado)?.label ?? doc.estado
                  const isDelDoc = deletingDoc === doc.id
                  const confirmDelD = confirmDelDoc === doc.id

                  return (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '0.5px solid #f4f6f8', opacity: isDelDoc ? 0.5 : 1 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#f4f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconFileText size={13} style={{ color: '#9ca3af' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nombre}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{doc.tipo} · {doc.version} · {formatDateTime(doc.fecha_subida)} · {doc.subido.nombre}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, flexShrink: 0, ...estadoStyle }}>
                        {estadoLabel}
                      </span>
                      <button onClick={() => handleDownload(doc.id)} disabled={downloadingDoc === doc.id} title="Descargar"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '0.5px solid #e8eaed', color: downloadingDoc === doc.id ? '#b0b7c3' : '#6b7280', flexShrink: 0, background: 'none', cursor: downloadingDoc === doc.id ? 'default' : 'pointer' }}>
                        <IconDownload size={13} />
                      </button>
                      {confirmDelD ? (
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button onClick={() => handleDeleteDoc(doc.id, carpeta.id)} style={{ fontSize: 11, padding: '3px 8px', backgroundColor: '#a32d2d', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Eliminar</button>
                          <button onClick={() => setConfirmDelDoc(null)} style={{ fontSize: 11, padding: '3px 8px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 5, background: 'none', cursor: 'pointer' }}>Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => !isDelDoc && setConfirmDelDoc(doc.id)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '0.5px solid #e8eaed', color: '#9ca3af', background: 'none', cursor: 'pointer', flexShrink: 0 }}>
                          {isDelDoc ? '...' : <IconTrash size={12} />}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
