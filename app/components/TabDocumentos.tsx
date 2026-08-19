'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  IconFolder, IconFolderOpen, IconPlus, IconX, IconFileText,
  IconDownload, IconTrash, IconUpload, IconCheck, IconPencil,
} from '@tabler/icons-react'
import { usePuede } from '@/app/lib/session-context'

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
  created_at: string
  documentos: Documento[]
}

type UploadStep = 'idle' | 'presigning' | 'uploading' | 'saving'

const TIPOS_DOC = [
  'Propuesta técnica', 'Propuesta económica', 'Contrato', 'Addenda',
  'Informe técnico', 'Plano', 'Memoria descriptiva', 'Certificado', 'Otro',
]

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function TabDocumentos({ proyectoId }: { proyectoId: string }) {
  const puedeSubir = usePuede('subir_documentos')
  const [carpetas, setCarpetas] = useState<Carpeta[]>([])
  const [loading, setLoading] = useState(true)
  const [expandida, setExpandida] = useState<string | null>(null)

  // Nueva carpeta
  const [showNuevaCarpeta, setShowNuevaCarpeta] = useState(false)
  const [nuevaNombre, setNuevaNombre] = useState('')
  const [creando, setCreando] = useState(false)

  // Eliminar carpeta
  const [confirmDelCarpeta, setConfirmDelCarpeta] = useState<string | null>(null)
  const [deletingCarpeta, setDeletingCarpeta] = useState<string | null>(null)

  // Eliminar doc
  const [confirmDelDoc, setConfirmDelDoc] = useState<string | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null)

  // Descargar doc
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null)

  // Editar doc
  const [editDocId, setEditDocId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', tipo: '', version: '', estado: '' })
  const [savingEdit, setSavingEdit] = useState(false)

  // Upload
  const [uploadCarpetaId, setUploadCarpetaId] = useState<string | null>(null)
  const [uploadForm, setUploadForm] = useState({ nombre: '', tipo: '', version: 'v1.0', estado: 'borrador' })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchCarpetas = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/carpetas?modulo=documentos`)
      if (res.ok) setCarpetas(await res.json())
    } finally {
      setLoading(false)
    }
  }, [proyectoId])

  useEffect(() => { fetchCarpetas() }, [fetchCarpetas])

  async function handleCrear() {
    if (!nuevaNombre.trim()) return
    setCreando(true)
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/carpetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevaNombre.trim(), modulo: 'documentos' }),
      })
      if (res.ok) {
        const nueva = await res.json()
        setCarpetas((prev) => [...prev, { ...nueva, documentos: [] }])
        setNuevaNombre('')
        setShowNuevaCarpeta(false)
        setExpandida(nueva.id)
      }
    } finally {
      setCreando(false)
    }
  }

  async function handleDeleteCarpeta(id: string) {
    setDeletingCarpeta(id)
    setConfirmDelCarpeta(null)
    try {
      const res = await fetch(`/api/carpetas/${id}`, { method: 'DELETE' })
      if (res.ok) setCarpetas((prev) => prev.filter((c) => c.id !== id))
    } finally {
      setDeletingCarpeta(null)
    }
  }

  async function handleDeleteDoc(docId: string, carpetaId: string) {
    setDeletingDoc(docId)
    setConfirmDelDoc(null)
    try {
      const res = await fetch(`/api/documentos/${docId}`, { method: 'DELETE' })
      if (res.ok) {
        setCarpetas((prev) => prev.map((c) =>
          c.id === carpetaId ? { ...c, documentos: c.documentos.filter((d) => d.id !== docId) } : c
        ))
      }
    } finally {
      setDeletingDoc(null)
    }
  }

  async function handleDownload(docId: string) {
    setDownloadingDoc(docId)
    try {
      const res = await fetch(`/api/documentos/${docId}/download`)
      if (res.ok) {
        const { url } = await res.json()
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } finally {
      setDownloadingDoc(null)
    }
  }

  function startEdit(doc: Documento) {
    setEditDocId(doc.id)
    setEditForm({ nombre: doc.nombre, tipo: doc.tipo, version: doc.version, estado: doc.estado })
    setConfirmDelDoc(null)
  }

  async function handleSaveEdit(carpetaId: string) {
    if (!editDocId) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/documentos/${editDocId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setCarpetas((prev) => prev.map((c) =>
          c.id === carpetaId
            ? { ...c, documentos: c.documentos.map((d) => d.id === editDocId ? { ...d, ...updated } : d) }
            : c
        ))
        setEditDocId(null)
      }
    } finally {
      setSavingEdit(false)
    }
  }

  function startUpload(carpetaId: string) {
    setUploadCarpetaId(carpetaId)
    setUploadForm({ nombre: '', tipo: '', version: 'v1.0', estado: 'borrador' })
    setUploadFile(null)
    setUploadStep('idle')
    setUploadProgress(0)
    setUploadError('')
    setExpandida(carpetaId)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setUploadFile(null); return }
    setUploadFile(file)
    if (!uploadForm.nombre) {
      setUploadForm((p) => ({ ...p, nombre: file.name.replace(/\.[^/.]+$/, '') }))
    }
  }

  async function handleUpload() {
    if (!uploadFile || !uploadForm.nombre.trim() || !uploadForm.tipo.trim()) {
      setUploadError('Archivo, nombre y tipo son requeridos')
      return
    }
    if (!uploadCarpetaId) return
    setUploadError('')
    setUploadProgress(0)
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
        setUploadStep('idle')
        return
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
      setUploadProgress(100)

      setUploadStep('saving')
      const metaRes = await fetch(`/api/proyectos/${proyectoId}/documentos/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          nombre: uploadForm.nombre.trim(),
          tipo: uploadForm.tipo.trim(),
          version: uploadForm.version,
          es_interno: true,
          estado: uploadForm.estado,
          carpeta_id: carpetaId,
        }),
      })
      if (!metaRes.ok) {
        const d = await metaRes.json()
        setUploadError(d.error ?? 'Error al guardar')
        setUploadStep('idle')
        return
      }
      const nuevoDoc = await metaRes.json()
      setCarpetas((prev) => prev.map((c) =>
        c.id === carpetaId ? { ...c, documentos: [nuevoDoc, ...c.documentos] } : c
      ))
      setUploadCarpetaId(null)
      setUploadStep('idle')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error inesperado')
      setUploadStep('idle')
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    padding: '6px 10px', fontSize: 12,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none',
    boxSizing: 'border-box', width: '100%',
  }

  const uploading = uploadStep !== 'idle'

  if (loading) return <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando...</p>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>Carpetas de documentos</span>
        {!showNuevaCarpeta ? (
          <button
            onClick={() => setShowNuevaCarpeta(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 500, color: '#004aad',
              padding: '6px 14px', borderRadius: 7,
              border: '0.5px solid #004aad', background: 'none', cursor: 'pointer',
            }}
          >
            <IconPlus size={13} /> Crear carpeta
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              autoFocus
              value={nuevaNombre}
              onChange={(e) => setNuevaNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCrear()}
              placeholder="Nombre de la carpeta..."
              style={{ ...inp, width: 220, fontSize: 13 }}
            />
            <button
              onClick={handleCrear}
              disabled={!nuevaNombre.trim() || creando}
              style={{ fontSize: 12, padding: '6px 12px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: creando ? 0.6 : 1 }}
            >
              {creando ? '...' : 'Crear'}
            </button>
            <button
              onClick={() => { setShowNuevaCarpeta(false); setNuevaNombre('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
            >
              <IconX size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Lista de carpetas */}
      {carpetas.length === 0 ? (
        <div style={{ border: '1px dashed #e8eaed', borderRadius: 10, padding: 48, textAlign: 'center' }}>
          <IconFolder size={28} style={{ color: '#d1d5db', margin: '0 auto 10px', display: 'block' }} />
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Sin carpetas. Crea una para empezar.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {carpetas.map((carpeta) => {
            const abierta = expandida === carpeta.id
            const isDeleting = deletingCarpeta === carpeta.id
            const confirmDel = confirmDelCarpeta === carpeta.id
            const isEmpty = carpeta.documentos.length === 0

            return (
              <div
                key={carpeta.id}
                style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, overflow: 'hidden' }}
              >
                {/* Carpeta header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
                  <button
                    onClick={() => setExpandida(abierta ? null : carpeta.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    {abierta
                      ? <IconFolderOpen size={18} style={{ color: '#004aad', flexShrink: 0 }} />
                      : <IconFolder size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />
                    }
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e' }}>{carpeta.nombre}</span>
                    <span style={{ fontSize: 11, color: '#b0b7c3', marginLeft: 4 }}>
                      {carpeta.documentos.length} doc{carpeta.documentos.length !== 1 ? 's' : ''}
                    </span>
                  </button>

                  {/* Subir doc button */}
                  {puedeSubir && uploadCarpetaId !== carpeta.id && (
                    <button
                      onClick={() => startUpload(carpeta.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: 500, color: '#004aad',
                        padding: '4px 10px', borderRadius: 5,
                        border: '0.5px solid #004aad', background: 'none', cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      <IconUpload size={11} /> Subir documento
                    </button>
                  )}

                  {/* Eliminar carpeta */}
                  {confirmDel ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                      {isEmpty ? (
                        <>
                          <button
                            onClick={() => handleDeleteCarpeta(carpeta.id)}
                            style={{ fontSize: 11, padding: '3px 8px', backgroundColor: '#a32d2d', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => setConfirmDelCarpeta(null)}
                            style={{ fontSize: 11, padding: '3px 8px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 5, background: 'none', cursor: 'pointer' }}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: '#a32d2d' }}>
                          Vacía la carpeta primero
                          <button onClick={() => setConfirmDelCarpeta(null)} style={{ marginLeft: 6, fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelCarpeta(carpeta.id)}
                      disabled={isDeleting}
                      title="Eliminar carpeta"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '0.5px solid #e8eaed', color: '#9ca3af', background: 'none', cursor: 'pointer', flexShrink: 0 }}
                    >
                      {isDeleting ? '...' : <IconTrash size={12} />}
                    </button>
                  )}
                </div>

                {/* Upload form inline */}
                {puedeSubir && uploadCarpetaId === carpeta.id && (
                  <div style={{ padding: '12px 16px', borderTop: '0.5px solid #f4f6f8', backgroundColor: '#f9fafb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#1a1d1e' }}>Subir documento</span>
                      <button onClick={() => setUploadCarpetaId(null)} disabled={uploading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                        <IconX size={14} />
                      </button>
                    </div>

                    {/* File picker */}
                    <div
                      onClick={() => !uploading && fileRef.current?.click()}
                      style={{
                        border: '1.5px dashed #e8eaed', borderRadius: 8, padding: '16px',
                        textAlign: 'center', cursor: uploading ? 'default' : 'pointer',
                        backgroundColor: '#ffffff', marginBottom: 10,
                      }}
                    >
                      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} disabled={uploading} />
                      {uploadFile ? (
                        <span style={{ fontSize: 12, color: '#1a1d1e' }}>{uploadFile.name}</span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>Clic para seleccionar archivo</span>
                      )}
                    </div>

                    {uploadStep === 'uploading' && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ height: 4, backgroundColor: '#e8eaed', borderRadius: 2 }}>
                          <div style={{ height: 4, width: `${uploadProgress}%`, backgroundColor: '#004aad', borderRadius: 2, transition: 'width 0.15s' }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{uploadProgress}%</span>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Nombre *</label>
                        <input value={uploadForm.nombre} onChange={(e) => setUploadForm((p) => ({ ...p, nombre: e.target.value }))} style={inp} disabled={uploading} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Tipo *</label>
                        <input
                          list="tipos-doc-list"
                          value={uploadForm.tipo}
                          onChange={(e) => setUploadForm((p) => ({ ...p, tipo: e.target.value }))}
                          placeholder="Selecciona o escribe..."
                          style={inp}
                          disabled={uploading}
                        />
                        <datalist id="tipos-doc-list">
                          {TIPOS_DOC.map((t) => <option key={t} value={t} />)}
                        </datalist>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Versión</label>
                        <input value={uploadForm.version} onChange={(e) => setUploadForm((p) => ({ ...p, version: e.target.value }))} style={inp} disabled={uploading} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Estado</label>
                        <select value={uploadForm.estado} onChange={(e) => setUploadForm((p) => ({ ...p, estado: e.target.value }))} style={{ ...inp, cursor: 'pointer' }} disabled={uploading}>
                          {ESTADOS_DOC.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </div>
                    </div>

                    {uploadError && <p style={{ fontSize: 12, color: '#a32d2d', marginBottom: 8 }}>{uploadError}</p>}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}
                      >
                        {uploadStep === 'presigning' ? 'Preparando...'
                          : uploadStep === 'uploading' ? `Subiendo ${uploadProgress}%`
                          : uploadStep === 'saving' ? 'Guardando...'
                          : 'Subir'}
                      </button>
                      <button onClick={() => setUploadCarpetaId(null)} disabled={uploading} style={{ fontSize: 12, padding: '6px 12px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Docs list */}
                {abierta && carpeta.documentos.length > 0 && (
                  <div style={{ borderTop: '0.5px solid #f4f6f8' }}>
                    {carpeta.documentos.map((doc, i) => {
                      const estadoStyle = ESTADO_STYLES[doc.estado] ?? { backgroundColor: '#f4f6f8', color: '#6b7280' }
                      const estadoLabel = ESTADOS_DOC.find((e) => e.value === doc.estado)?.label ?? doc.estado
                      const isDelDoc = deletingDoc === doc.id
                      const confirmDelD = confirmDelDoc === doc.id
                      const isEditing = editDocId === doc.id
                      const borderBottom = i < carpeta.documentos.length - 1 ? '0.5px solid #f4f6f8' : 'none'

                      if (isEditing) {
                        return (
                          <div key={doc.id} style={{ padding: '12px 16px', borderBottom, backgroundColor: '#f9fafb' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                              <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Nombre</label>
                                <input value={editForm.nombre} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} style={inp} disabled={savingEdit} />
                              </div>
                              <div>
                                <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Tipo</label>
                                <input list="tipos-doc-edit" value={editForm.tipo} onChange={(e) => setEditForm((p) => ({ ...p, tipo: e.target.value }))} style={inp} disabled={savingEdit} />
                                <datalist id="tipos-doc-edit">
                                  {TIPOS_DOC.map((t) => <option key={t} value={t} />)}
                                </datalist>
                              </div>
                              <div>
                                <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Versión</label>
                                <input value={editForm.version} onChange={(e) => setEditForm((p) => ({ ...p, version: e.target.value }))} style={inp} disabled={savingEdit} />
                              </div>
                              <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Estado</label>
                                <select value={editForm.estado} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))} style={{ ...inp, cursor: 'pointer' }} disabled={savingEdit}>
                                  {ESTADOS_DOC.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                                </select>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => handleSaveEdit(carpeta.id)} disabled={savingEdit} style={{ fontSize: 12, fontWeight: 500, padding: '5px 14px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: savingEdit ? 0.6 : 1 }}>
                                {savingEdit ? 'Guardando...' : 'Guardar'}
                              </button>
                              <button onClick={() => setEditDocId(null)} disabled={savingEdit} style={{ fontSize: 12, padding: '5px 12px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                            borderBottom,
                            opacity: isDelDoc ? 0.5 : 1,
                          }}
                        >
                          <div style={{ width: 30, height: 30, borderRadius: 7, backgroundColor: '#f4f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <IconFileText size={14} style={{ color: '#9ca3af' }} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.nombre}
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                              {doc.tipo} · v{doc.version} · {formatDateTime(doc.fecha_subida)} · {doc.subido.nombre}
                            </div>
                          </div>

                          <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, flexShrink: 0, ...estadoStyle }}>
                            {estadoLabel}
                          </span>

                          <button
                            onClick={() => handleDownload(doc.id)}
                            disabled={downloadingDoc === doc.id}
                            title="Descargar"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '0.5px solid #e8eaed', color: downloadingDoc === doc.id ? '#b0b7c3' : '#6b7280', flexShrink: 0, background: 'none', cursor: downloadingDoc === doc.id ? 'default' : 'pointer' }}
                          >
                            <IconDownload size={13} />
                          </button>

                          <button onClick={() => startEdit(doc)} title="Editar"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '0.5px solid #e8eaed', color: '#9ca3af', background: 'none', cursor: 'pointer', flexShrink: 0 }}>
                            <IconPencil size={12} />
                          </button>

                          {confirmDelD ? (
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <button onClick={() => handleDeleteDoc(doc.id, carpeta.id)} style={{ fontSize: 11, padding: '3px 8px', backgroundColor: '#a32d2d', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}>
                                Eliminar
                              </button>
                              <button onClick={() => setConfirmDelDoc(null)} style={{ fontSize: 11, padding: '3px 8px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 5, background: 'none', cursor: 'pointer' }}>
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => !isDelDoc && setConfirmDelDoc(doc.id)} title="Eliminar"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '0.5px solid #e8eaed', color: '#9ca3af', background: 'none', cursor: 'pointer', flexShrink: 0 }}>
                              {isDelDoc ? '...' : <IconTrash size={12} />}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {abierta && carpeta.documentos.length === 0 && uploadCarpetaId !== carpeta.id && (
                  <div style={{ padding: '16px 16px', borderTop: '0.5px solid #f4f6f8', textAlign: 'center' }}>
                    <p style={{ fontSize: 12, color: '#b0b7c3', margin: 0 }}>Carpeta vacía. Sube el primer documento.</p>
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
