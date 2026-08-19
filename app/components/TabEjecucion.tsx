'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  IconPlus, IconX, IconCloudRain, IconSun, IconCloud, IconBolt,
  IconAlertTriangle, IconFileText, IconDownload, IconTrash, IconUpload,
} from '@tabler/icons-react'
import { usePuede } from '@/app/lib/session-context'

// ─── Fixed section types / constants ──────────────────────────────────────────

const SECCIONES_FIJAS = [
  'Documentos de Operaciones',
  'Administrativos',
  'Doc de Seguridad y Medio Ambiente',
]

const ESTADOS_FIJOS = [
  { value: 'borrador',            label: 'Borrador' },
  { value: 'pendiente_revision',  label: 'Pendiente revisión' },
  { value: 'enviado_cliente',     label: 'Enviado al cliente' },
  { value: 'con_observaciones',   label: 'Con observaciones' },
  { value: 'aprobado',            label: 'Aprobado' },
  { value: 'revisado',            label: 'Revisado' },
]

const ESTADO_FIJO_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  borrador:           { backgroundColor: '#f4f6f8', color: '#6b7280' },
  enviado_cliente:    { backgroundColor: '#e0f4fc', color: '#0c6a8c' },
  con_observaciones:  { backgroundColor: '#faeeda', color: '#854f0b' },
  aprobado:           { backgroundColor: '#eaf3de', color: '#3b6d11' },
  pendiente_revision: { backgroundColor: '#faeeda', color: '#854f0b' },
  revisado:           { backgroundColor: '#eaf3de', color: '#3b6d11' },
}

// ─── SeccionPanel ─────────────────────────────────────────────────────────────

function SeccionPanel({
  seccion,
  carpeta,
  proyectoId,
  onDocAdded,
  onDocDeleted,
  onCarpetaCreated,
}: {
  seccion: string
  carpeta: CarpetaFija | undefined
  proyectoId: string
  onDocAdded: (carpetaId: string, doc: DocFijo) => void
  onDocDeleted: (carpetaId: string, docId: string) => void
  onCarpetaCreated: (carpeta: CarpetaFija) => void
}) {
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({ nombre: '', tipo: '', version: 'V00', estado: 'borrador' })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadStep, setUploadStepF] = useState<'idle' | 'presigning' | 'uploading' | 'saving'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [confirmDelDoc, setConfirmDelDoc] = useState<string | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null)
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploading = uploadStep !== 'idle'

  function handleStartUpload() {
    setShowUpload(true)
    setUploadForm({ nombre: '', tipo: '', version: 'V00', estado: 'borrador' })
    setUploadFile(null); setUploadStepF('idle')
    setUploadProgress(0); setUploadError('')
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
    setUploadError(''); setUploadProgress(0)

    try {
      let carpetaId = carpeta?.id
      if (!carpetaId) {
        const res = await fetch(`/api/proyectos/${proyectoId}/carpetas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: seccion, modulo: 'ejecucion_fija' }),
        })
        if (!res.ok) { setUploadError('Error al crear sección'); return }
        const nueva: CarpetaFija = await res.json()
        onCarpetaCreated({ ...nueva, documentos: [] })
        carpetaId = nueva.id
      }

      setUploadStepF('presigning')
      const presignRes = await fetch('/api/documentos/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: uploadFile.name, proyectoId, fileSize: uploadFile.size }),
      })
      if (!presignRes.ok) {
        const d = await presignRes.json()
        setUploadError(d.error ?? 'Error al iniciar subida')
        setUploadStepF('idle'); return
      }
      const { signedUrl, path } = await presignRes.json()

      setUploadStepF('uploading')
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

      setUploadStepF('saving')
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
        setUploadStepF('idle'); return
      }
      const nuevoDoc = await metaRes.json()
      onDocAdded(carpetaId, nuevoDoc)
      setShowUpload(false); setUploadStepF('idle')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error inesperado')
      setUploadStepF('idle')
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
    } finally { setDownloadingDoc(null) }
  }

  async function handleDeleteDoc(docId: string) {
    setDeletingDoc(docId); setConfirmDelDoc(null)
    try {
      const res = await fetch(`/api/documentos/${docId}`, { method: 'DELETE' })
      if (res.ok && carpeta) onDocDeleted(carpeta.id, docId)
    } finally { setDeletingDoc(null) }
  }

  const inp: React.CSSProperties = {
    padding: '6px 10px', fontSize: 12,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none',
    boxSizing: 'border-box', width: '100%',
  }

  const docs = carpeta?.documentos ?? []

  return (
    <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: docs.length > 0 || showUpload ? '0.5px solid #f4f6f8' : 'none' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>{seccion}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#b0b7c3' }}>{docs.length} doc{docs.length !== 1 ? 's' : ''}</span>
          {!showUpload && (
            <button onClick={handleStartUpload}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: '#004aad', padding: '4px 10px', borderRadius: 5, border: '0.5px solid #004aad', background: 'none', cursor: 'pointer' }}>
              <IconUpload size={11} /> Subir documento
            </button>
          )}
        </div>
      </div>

      {showUpload && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f9fafb', borderBottom: docs.length > 0 ? '0.5px solid #f4f6f8' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#1a1d1e' }}>Subir documento en "{seccion}"</span>
            <button onClick={() => setShowUpload(false)} disabled={uploading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
              <IconX size={14} />
            </button>
          </div>

          <div onClick={() => !uploading && fileRef.current?.click()}
            style={{ border: '1.5px dashed #e8eaed', borderRadius: 8, padding: '14px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', backgroundColor: '#ffffff', marginBottom: 10 }}>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} disabled={uploading} />
            {uploadFile
              ? <span style={{ fontSize: 12, color: '#1a1d1e' }}>{uploadFile.name}</span>
              : <span style={{ fontSize: 12, color: '#9ca3af' }}>Clic para seleccionar archivo</span>}
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
                list="tipos-ejec-fija-list"
                value={uploadForm.tipo}
                onChange={(e) => setUploadForm((p) => ({ ...p, tipo: e.target.value }))}
                placeholder="Ej: Procedimiento"
                style={inp}
                disabled={uploading}
              />
              <datalist id="tipos-ejec-fija-list">
                {['Procedimiento', 'Protocolo', 'Certificado', 'Informe', 'Reporte', 'Contrato', 'Otro'].map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Versión</label>
              <input value={uploadForm.version} onChange={(e) => setUploadForm((p) => ({ ...p, version: e.target.value }))} style={inp} disabled={uploading} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Estado</label>
              <select value={uploadForm.estado} onChange={(e) => setUploadForm((p) => ({ ...p, estado: e.target.value }))} style={{ ...inp, cursor: 'pointer' }} disabled={uploading}>
                {ESTADOS_FIJOS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
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
            <button onClick={() => setShowUpload(false)} disabled={uploading}
              style={{ fontSize: 12, padding: '6px 12px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {docs.map((doc) => {
        const estadoStyle = ESTADO_FIJO_STYLES[doc.estado] ?? { backgroundColor: '#f4f6f8', color: '#6b7280' }
        const estadoLabel = ESTADOS_FIJOS.find((e) => e.value === doc.estado)?.label ?? doc.estado
        const isDelDoc = deletingDoc === doc.id
        const confirmDelD = confirmDelDoc === doc.id

        return (
          <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '0.5px solid #f4f6f8', opacity: isDelDoc ? 0.5 : 1 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, backgroundColor: '#f4f6f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconFileText size={14} style={{ color: '#9ca3af' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nombre}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{doc.tipo} · {doc.version} · {new Date(doc.fecha_subida).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {doc.subido.nombre}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, flexShrink: 0, ...estadoStyle }}>{estadoLabel}</span>
            <button onClick={() => handleDownload(doc.id)} disabled={downloadingDoc === doc.id} title="Descargar"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '0.5px solid #e8eaed', color: downloadingDoc === doc.id ? '#b0b7c3' : '#6b7280', flexShrink: 0, background: 'none', cursor: downloadingDoc === doc.id ? 'default' : 'pointer' }}>
              <IconDownload size={13} />
            </button>
            {confirmDelD ? (
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => handleDeleteDoc(doc.id)} style={{ fontSize: 11, padding: '3px 8px', backgroundColor: '#a32d2d', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Eliminar</button>
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

      {docs.length === 0 && !showUpload && (
        <div style={{ padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#b0b7c3', margin: 0 }}>Sin documentos en esta sección.</p>
        </div>
      )}
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocSubidoFijo { nombre: string }
interface DocFijo {
  id: string; nombre: string; tipo: string; version: string
  estado: string; url: string; fecha_subida: string; subido: DocSubidoFijo
}
interface CarpetaFija {
  id: string; nombre: string; modulo: string; documentos: DocFijo[]
}

interface PersonalItem { nombre: string; rol: string; horas: number }
interface EquipoItem   { tipo: string; horas: number }
interface ReporteCampo {
  id: string; fecha: string; descripcion: string; clima: string
  incidente: boolean; desc_incidente?: string | null
  usuario: { nombre: string }
  personal: PersonalItem[]
  equipos: EquipoItem[]
  created_at: string
}

interface DocSubido { nombre: string }
interface Documento {
  id: string; nombre: string; tipo: string; version: string
  estado: string; url: string; fecha_subida: string; subido: DocSubido
}
interface Carpeta {
  id: string; nombre: string; modulo: string; documentos: Documento[]
}

type UploadStep = 'idle' | 'presigning' | 'uploading' | 'saving'

const CLIMAS = [
  { value: 'soleado',  label: 'Soleado',  icon: <IconSun size={20} /> },
  { value: 'nublado',  label: 'Nublado',  icon: <IconCloud size={20} /> },
  { value: 'lluvia',   label: 'Lluvia',   icon: <IconCloudRain size={20} /> },
  { value: 'tormenta', label: 'Tormenta', icon: <IconBolt size={20} /> },
]

const ROLES_CAMPO = ['Ingeniero', 'Tecnico', 'Peon', 'Operador', 'Topografo']

const ESTADOS_DOC = [
  { value: 'borrador',           label: 'Borrador' },
  { value: 'pendiente_revision', label: 'Pendiente revisión' },
  { value: 'aprobado',           label: 'Aprobado' },
]

const ESTADO_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  borrador:           { backgroundColor: '#f4f6f8', color: '#6b7280' },
  pendiente_revision: { backgroundColor: '#faeeda', color: '#854f0b' },
  aprobado:           { backgroundColor: '#eaf3de', color: '#3b6d11' },
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function ClimaIcon({ clima }: { clima: string }) {
  const c = CLIMAS.find((x) => x.value === clima)
  return <span title={c?.label ?? clima}>{c?.icon ?? clima}</span>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TabEjecucion({ proyectoId }: { proyectoId: string }) {
  const puedeEditarCampo = usePuede('editar_reportes_campo')
  // ── Reportes de campo ──
  const [reportes, setReportes] = useState<ReporteCampo[]>([])
  const [loadingRep, setLoadingRep] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [descripcion, setDescripcion] = useState('')
  const [clima, setClima] = useState('soleado')
  const [incidente, setIncidente] = useState(false)
  const [descIncidente, setDescIncidente] = useState('')
  const [personal, setPersonal] = useState<PersonalItem[]>([{ nombre: '', rol: ROLES_CAMPO[0], horas: 8 }])
  const [equipos, setEquipos] = useState<EquipoItem[]>([])
  const [saving, setSaving] = useState(false)
  const [errorRep, setErrorRep] = useState('')

  // ── Secciones fijas ──
  const [carpetasFijas, setCarpetasFijas] = useState<CarpetaFija[]>([])

  // ── Documentos de operaciones en campo ──
  const [carpetas, setCarpetas] = useState<Carpeta[]>([])
  const [loadingCarp, setLoadingCarp] = useState(true)
  const [expandidaCarp, setExpandidaCarp] = useState<string | null>(null)
  const [showNuevaCarpeta, setShowNuevaCarpeta] = useState(false)
  const [nuevaNombre, setNuevaNombre] = useState('')
  const [creando, setCreando] = useState(false)
  const [confirmDelCarpeta, setConfirmDelCarpeta] = useState<string | null>(null)
  const [deletingCarpeta, setDeletingCarpeta] = useState<string | null>(null)
  const [confirmDelDoc, setConfirmDelDoc] = useState<string | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null)
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null)
  const [uploadCarpetaId, setUploadCarpetaId] = useState<string | null>(null)
  const [uploadForm, setUploadForm] = useState({ nombre: '', tipo: '', version: 'v1.0', estado: 'borrador' })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadStep, setUploadStep] = useState<UploadStep>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchReportes = useCallback(async () => {
    setLoadingRep(true)
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/campo`)
      if (res.ok) setReportes(await res.json())
    } finally {
      setLoadingRep(false)
    }
  }, [proyectoId])

  const fetchCarpetasFijas = useCallback(async () => {
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/carpetas?modulo=ejecucion_fija`)
      if (res.ok) setCarpetasFijas(await res.json())
    } catch { /* silent */ }
  }, [proyectoId])

  const fetchCarpetas = useCallback(async () => {
    setLoadingCarp(true)
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/carpetas?modulo=ejecucion`)
      if (res.ok) setCarpetas(await res.json())
    } finally {
      setLoadingCarp(false)
    }
  }, [proyectoId])

  useEffect(() => { fetchReportes(); fetchCarpetasFijas(); fetchCarpetas() }, [fetchReportes, fetchCarpetasFijas, fetchCarpetas])

  async function handleCreateReporte() {
    if (!descripcion.trim()) { setErrorRep('La descripción es requerida'); return }
    setSaving(true)
    setErrorRep('')
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/campo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha, descripcion: descripcion.trim(), clima, incidente,
          desc_incidente: incidente ? descIncidente : undefined,
          personal: personal.filter((p) => p.nombre.trim()),
          equipos: equipos.filter((e) => e.tipo.trim()),
        }),
      })
      if (!res.ok) { setErrorRep('Error al guardar'); return }
      const nuevo = await res.json()
      setReportes((prev) => [nuevo, ...prev])
      setDescripcion(''); setClima('soleado'); setIncidente(false)
      setDescIncidente(''); setPersonal([{ nombre: '', rol: ROLES_CAMPO[0], horas: 8 }])
      setEquipos([]); setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  function handleDocAddedFija(carpetaId: string, doc: DocFijo) {
    setCarpetasFijas((prev) => prev.map((c) =>
      c.id === carpetaId ? { ...c, documentos: [doc, ...c.documentos] } : c
    ))
  }

  function handleDocDeletedFija(carpetaId: string, docId: string) {
    setCarpetasFijas((prev) => prev.map((c) =>
      c.id === carpetaId ? { ...c, documentos: c.documentos.filter((d) => d.id !== docId) } : c
    ))
  }

  function handleCarpetaFijaCreated(nueva: CarpetaFija) {
    setCarpetasFijas((prev) => [...prev, nueva])
  }

  async function handleCrearCarpeta() {
    if (!nuevaNombre.trim()) return
    setCreando(true)
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/carpetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevaNombre.trim(), modulo: 'ejecucion' }),
      })
      if (res.ok) {
        const nueva = await res.json()
        setCarpetas((prev) => [...prev, { ...nueva, documentos: [] }])
        setNuevaNombre(''); setShowNuevaCarpeta(false)
        setExpandidaCarp(nueva.id)
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
    } finally {
      setDownloadingDoc(null)
    }
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
    setUploadForm({ nombre: '', tipo: '', version: 'v1.0', estado: 'borrador' })
    setUploadFile(null); setUploadStep('idle')
    setUploadProgress(0); setUploadError('')
    setExpandidaCarp(carpetaId)
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

  const uploading = uploadStep !== 'idle'

  const inp: React.CSSProperties = {
    padding: '6px 10px', fontSize: 12,
    border: '0.5px solid #e8eaed', borderRadius: 6, outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Reportes de campo ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>Reportes de campo</span>
          {puedeEditarCampo && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: '#fff', backgroundColor: '#004aad', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}
            >
              <IconPlus size={13} /> Nuevo reporte
            </button>
          )}
        </div>

        {showForm && (
          <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 18, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>Nuevo reporte de campo</span>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={16} /></button>
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
                    <button key={c.value} onClick={() => setClima(c.value)} title={c.label}
                      style={{ width: 38, height: 38, borderRadius: 8, cursor: 'pointer', border: clima === c.value ? '2px solid #004aad' : '1px solid #e8eaed', backgroundColor: clima === c.value ? '#e8f0fd' : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: clima === c.value ? '#004aad' : '#6b7280' }}>
                      {c.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Descripción del avance *</label>
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describe el trabajo realizado hoy..." rows={3}
                style={{ ...inp, width: '100%', resize: 'vertical' }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, color: '#9ca3af' }}>Personal en campo</label>
                <button onClick={() => setPersonal((p) => [...p, { nombre: '', rol: ROLES_CAMPO[0], horas: 8 }])}
                  style={{ fontSize: 11, color: '#004aad', background: 'none', border: 'none', cursor: 'pointer' }}>+ Agregar</button>
              </div>
              {personal.map((p, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <input placeholder="Nombre" value={p.nombre}
                    onChange={(e) => setPersonal((prev) => prev.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))}
                    style={inp} />
                  <select value={p.rol} onChange={(e) => setPersonal((prev) => prev.map((x, j) => j === i ? { ...x, rol: e.target.value } : x))}
                    style={{ ...inp, cursor: 'pointer' }}>
                    {ROLES_CAMPO.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input type="number" min={1} max={24} value={p.horas}
                    onChange={(e) => setPersonal((prev) => prev.map((x, j) => j === i ? { ...x, horas: Number(e.target.value) } : x))}
                    style={{ ...inp, width: 60 }} />
                  <button onClick={() => setPersonal((prev) => prev.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a32d2d' }}><IconX size={14} /></button>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, color: '#9ca3af' }}>Equipos utilizados</label>
                <button onClick={() => setEquipos((e) => [...e, { tipo: '', horas: 8 }])}
                  style={{ fontSize: 11, color: '#004aad', background: 'none', border: 'none', cursor: 'pointer' }}>+ Agregar</button>
              </div>
              {equipos.map((eq, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <input placeholder="Tipo de equipo" value={eq.tipo}
                    onChange={(e) => setEquipos((prev) => prev.map((x, j) => j === i ? { ...x, tipo: e.target.value } : x))}
                    style={inp} />
                  <input type="number" min={1} max={24} value={eq.horas}
                    onChange={(e) => setEquipos((prev) => prev.map((x, j) => j === i ? { ...x, horas: Number(e.target.value) } : x))}
                    style={{ ...inp, width: 60 }} />
                  <button onClick={() => setEquipos((prev) => prev.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a32d2d' }}><IconX size={14} /></button>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={incidente} onChange={(e) => setIncidente(e.target.checked)} />
                <IconAlertTriangle size={14} style={{ color: '#854f0b' }} />
                Hubo un incidente
              </label>
              {incidente && (
                <textarea value={descIncidente} onChange={(e) => setDescIncidente(e.target.value)}
                  placeholder="Describe el incidente..." rows={2}
                  style={{ ...inp, width: '100%', marginTop: 8, resize: 'vertical' }} />
              )}
            </div>

            {errorRep && <p style={{ fontSize: 12, color: '#a32d2d', marginBottom: 10 }}>{errorRep}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleCreateReporte} disabled={saving}
                style={{ fontSize: 12, fontWeight: 500, padding: '7px 18px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar reporte'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ fontSize: 12, padding: '7px 12px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {loadingRep ? (
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando...</p>
        ) : reportes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed #e8eaed', borderRadius: 10 }}>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Sin reportes de campo. Crea el primero.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reportes.map((r) => (
              <div key={r.id} style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 8, overflow: 'hidden' }}>
                <div onClick={() => setExpandido(expandido === r.id ? null : r.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}>
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

      {/* ── Secciones fijas ── */}
      {SECCIONES_FIJAS.map((seccion) => (
        <SeccionPanel
          key={seccion}
          seccion={seccion}
          carpeta={carpetasFijas.find((c) => c.nombre === seccion)}
          proyectoId={proyectoId}
          onDocAdded={handleDocAddedFija}
          onDocDeleted={handleDocDeletedFija}
          onCarpetaCreated={handleCarpetaFijaCreated}
        />
      ))}

      {/* ── Documentos de operaciones en campo ── */}
      <div>
        <div style={{ borderTop: '1px solid #e8eaed', paddingTop: 20, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>Documentos de operaciones en campo</span>
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

          {loadingCarp ? (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando...</p>
          ) : carpetas.length === 0 ? (
            <div style={{ border: '1px dashed #e8eaed', borderRadius: 10, padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Sin carpetas de documentos de campo.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {carpetas.map((carpeta) => {
                const abierta = expandidaCarp === carpeta.id
                const isDelC = deletingCarpeta === carpeta.id
                const confirmDelC = confirmDelCarpeta === carpeta.id
                const isEmpty = carpeta.documentos.length === 0

                return (
                  <div key={carpeta.id} style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}>
                      <button onClick={() => setExpandidaCarp(abierta ? null : carpeta.id)}
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

                    {uploadCarpetaId === carpeta.id && (
                      <div style={{ padding: '12px 16px', borderTop: '0.5px solid #f4f6f8', backgroundColor: '#f9fafb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#1a1d1e' }}>Subir documento</span>
                          <button onClick={() => setUploadCarpetaId(null)} disabled={uploading} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={14} /></button>
                        </div>
                        <div onClick={() => !uploading && fileRef.current?.click()}
                          style={{ border: '1.5px dashed #e8eaed', borderRadius: 8, padding: '14px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', backgroundColor: '#ffffff', marginBottom: 8 }}>
                          <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} disabled={uploading} />
                          {uploadFile ? <span style={{ fontSize: 12, color: '#1a1d1e' }}>{uploadFile.name}</span>
                            : <span style={{ fontSize: 12, color: '#9ca3af' }}>Clic para seleccionar archivo</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Nombre *</label>
                            <input value={uploadForm.nombre} onChange={(e) => setUploadForm((p) => ({ ...p, nombre: e.target.value }))} style={{ ...inp, width: '100%' }} disabled={uploading} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Tipo *</label>
                            <input value={uploadForm.tipo} onChange={(e) => setUploadForm((p) => ({ ...p, tipo: e.target.value }))} placeholder="Ej: Reporte" style={{ ...inp, width: '100%' }} disabled={uploading} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 3 }}>Versión</label>
                            <input value={uploadForm.version} onChange={(e) => setUploadForm((p) => ({ ...p, version: e.target.value }))} style={{ ...inp, width: '100%' }} disabled={uploading} />
                          </div>
                        </div>
                        {uploadError && <p style={{ fontSize: 12, color: '#a32d2d', marginBottom: 8 }}>{uploadError}</p>}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={handleUpload} disabled={uploading}
                            style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', backgroundColor: '#004aad', color: '#fff', border: 'none', borderRadius: 6, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                            {uploadStep === 'uploading' ? `Subiendo ${uploadProgress}%` : uploading ? '...' : 'Subir'}
                          </button>
                          <button onClick={() => setUploadCarpetaId(null)} disabled={uploading}
                            style={{ fontSize: 12, padding: '6px 12px', color: '#6b7280', border: '0.5px solid #e8eaed', borderRadius: 6, background: 'none', cursor: 'pointer' }}>Cancelar</button>
                        </div>
                      </div>
                    )}

                    {abierta && carpeta.documentos.map((doc, i) => {
                      const estadoStyle = ESTADO_STYLES[doc.estado] ?? { backgroundColor: '#f4f6f8', color: '#6b7280' }
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
                            {ESTADOS_DOC.find((e) => e.value === doc.estado)?.label ?? doc.estado}
                          </span>
                          <button
                            onClick={() => handleDownload(doc.id)}
                            disabled={downloadingDoc === doc.id}
                            title="Descargar"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '0.5px solid #e8eaed', color: downloadingDoc === doc.id ? '#b0b7c3' : '#6b7280', flexShrink: 0, background: 'none', cursor: downloadingDoc === doc.id ? 'default' : 'pointer' }}
                          >
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
      </div>
    </div>
  )
}
