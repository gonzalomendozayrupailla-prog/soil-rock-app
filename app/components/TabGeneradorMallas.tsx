'use client'

import { useState, useEffect, useRef } from 'react'
import {
  IconPlus, IconDownload, IconDeviceFloppy,
  IconArrowLeft, IconFileDescription,
} from '@tabler/icons-react'
import { generateMallasPDF, type MallaPDFData } from '@/app/lib/generateMallasPDF'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MallaFormState {
  codigo: string; version: string; fecha_doc: string
  especialista: string; contratista: string; entidad: string
  ubicacion: string; estructura: string; fecha: string
  n_registro: string; plano_referencial: string
  nivel_corona: string; nivel_pie_talud: string; n_columnas_malla: string
  malla_tipo: string; malla_marca: string; malla_abertura: string
  malla_diametro_alambre: string; malla_tipo_union: string; malla_norma: string
  alambre_material: string; alambre_diametro: string; alambre_tension_rotura: string
  grapas_material: string; grapas_diametro: string; grapas_tuercas: string
  inst_fecha: string; inst_ancho_rollo: string; inst_altura_rollo_fab: string
  inst_long_prot_ini: string; inst_altura_prot_ini: string
  inst_long_prot_fin: string; inst_altura_prot_fin: string
  inst_area_protegida: string; inst_uso_grapas: string
  representante_sr: string; representante_contratista: string
}

interface ReporteResumen {
  id: string; codigo: string; version: string; fecha_doc: string; n_registro: string | null; created_at: string
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const defaultForm: MallaFormState = {
  codigo: 'SGI-CAL-FOR-041', version: '00', fecha_doc: '',
  especialista: 'SOIL ROCK SAC', contratista: '', entidad: '',
  ubicacion: '', estructura: '', fecha: '', n_registro: '',
  plano_referencial: '', nivel_corona: '', nivel_pie_talud: '', n_columnas_malla: '',
  malla_tipo: '', malla_marca: '', malla_abertura: '',
  malla_diametro_alambre: '', malla_tipo_union: '', malla_norma: '',
  alambre_material: '', alambre_diametro: '', alambre_tension_rotura: '',
  grapas_material: '', grapas_diametro: '', grapas_tuercas: '',
  inst_fecha: '', inst_ancho_rollo: '', inst_altura_rollo_fab: '',
  inst_long_prot_ini: '', inst_altura_prot_ini: '',
  inst_long_prot_fin: '', inst_altura_prot_fin: '',
  inst_area_protegida: '', inst_uso_grapas: '',
  representante_sr: '', representante_contratista: '',
}

// ─── Image helpers ────────────────────────────────────────────────────────────

async function getBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = (e) => resolve(e.target?.result as string)
    r.readAsDataURL(file)
  })
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = (e) => resolve(e.target?.result as string)
    r.readAsDataURL(blob)
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TabGeneradorMallas({
  proyectoId, proyectoNombre, clienteNombre, proyectoUbicacion = '',
}: {
  proyectoId: string; proyectoNombre: string; clienteNombre: string; proyectoUbicacion?: string
}) {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [reportes, setReportes] = useState<ReporteResumen[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<MallaFormState>(defaultForm)

  // Imágenes: logo SR, logo cliente, registro fotográfico, elevación talud
  const [logoSrFile, setLogoSrFile] = useState<File | null>(null)
  const [logoSrPreview, setLogoSrPreview] = useState<string | null>(null)
  const [logoSrPath, setLogoSrPath] = useState<string | null>(null)

  const [logoClFile, setLogoClFile] = useState<File | null>(null)
  const [logoClPreview, setLogoClPreview] = useState<string | null>(null)
  const [logoClPath, setLogoClPath] = useState<string | null>(null)

  const [foto1File, setFoto1File] = useState<File | null>(null)
  const [foto1Preview, setFoto1Preview] = useState<string | null>(null)
  const [foto1Path, setFoto1Path] = useState<string | null>(null)

  const [foto2File, setFoto2File] = useState<File | null>(null)
  const [foto2Preview, setFoto2Preview] = useState<string | null>(null)
  const [foto2Path, setFoto2Path] = useState<string | null>(null)

  const [eleFile, setEleFile] = useState<File | null>(null)
  const [elePreview, setElePreview] = useState<string | null>(null)
  const [elePath, setElePath] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [genPdf, setGenPdf] = useState(false)
  const [error, setError] = useState('')

  const srRef   = useRef<HTMLInputElement>(null)
  const clRef   = useRef<HTMLInputElement>(null)
  const foto1Ref = useRef<HTMLInputElement>(null)
  const foto2Ref = useRef<HTMLInputElement>(null)
  const eleRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { loadList() }, [proyectoId])

  async function loadList() {
    setLoadingList(true)
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/reportes-malla`)
      if (res.ok) setReportes(await res.json())
    } finally { setLoadingList(false) }
  }

  function resetImages() {
    setLogoSrFile(null); setLogoSrPreview(null); setLogoSrPath(null)
    setLogoClFile(null); setLogoClPreview(null); setLogoClPath(null)
    setFoto1File(null);  setFoto1Preview(null);  setFoto1Path(null)
    setFoto2File(null);  setFoto2Preview(null);  setFoto2Path(null)
    setEleFile(null);    setElePreview(null);    setElePath(null)
  }

  function openNew() {
    setEditingId(null)
    setForm({ ...defaultForm, ubicacion: proyectoUbicacion })
    resetImages()
    setError('')
    setView('form')
  }

  async function openEdit(id: string) {
    try {
      const res = await fetch(`/api/reportes-malla/${id}`)
      if (!res.ok) { setError('Error al cargar reporte'); return }
      const d = await res.json()
      setEditingId(id)
      setForm({
        codigo: d.codigo, version: d.version, fecha_doc: d.fecha_doc ?? '',
        especialista: d.especialista ?? '', contratista: d.contratista ?? '',
        entidad: d.entidad ?? '', ubicacion: d.ubicacion ?? '', estructura: d.estructura ?? '',
        fecha: d.fecha ?? '', n_registro: d.n_registro ?? '',
        plano_referencial: d.plano_referencial ?? '', nivel_corona: d.nivel_corona ?? '',
        nivel_pie_talud: d.nivel_pie_talud ?? '', n_columnas_malla: d.n_columnas_malla ?? '',
        malla_tipo: d.malla_tipo ?? '', malla_marca: d.malla_marca ?? '',
        malla_abertura: d.malla_abertura ?? '', malla_diametro_alambre: d.malla_diametro_alambre ?? '',
        malla_tipo_union: d.malla_tipo_union ?? '', malla_norma: d.malla_norma ?? '',
        alambre_material: d.alambre_material ?? '', alambre_diametro: d.alambre_diametro ?? '',
        alambre_tension_rotura: d.alambre_tension_rotura ?? '',
        grapas_material: d.grapas_material ?? '', grapas_diametro: d.grapas_diametro ?? '',
        grapas_tuercas: d.grapas_tuercas ?? '',
        inst_fecha: d.inst_fecha ?? '', inst_ancho_rollo: d.inst_ancho_rollo ?? '',
        inst_altura_rollo_fab: d.inst_altura_rollo_fab ?? '',
        inst_long_prot_ini: d.inst_long_prot_ini ?? '', inst_altura_prot_ini: d.inst_altura_prot_ini ?? '',
        inst_long_prot_fin: d.inst_long_prot_fin ?? '', inst_altura_prot_fin: d.inst_altura_prot_fin ?? '',
        inst_area_protegida: d.inst_area_protegida ?? '', inst_uso_grapas: d.inst_uso_grapas ?? '',
        representante_sr: d.representante_sr ?? '', representante_contratista: d.representante_contratista ?? '',
      })
      setLogoSrPath(d.logo_sr_path ?? null)
      setLogoClPath(d.logo_cliente_path ?? null)
      setFoto1Path(d.foto_registro_1_path ?? null)
      setFoto2Path(d.foto_registro_2_path ?? null)
      setElePath(d.elevacion_path ?? null)
      setLogoSrFile(null); setLogoSrPreview(null)
      setLogoClFile(null); setLogoClPreview(null)
      setFoto1File(null);  setFoto1Preview(null)
      setFoto2File(null);  setFoto2Preview(null)
      setEleFile(null);    setElePreview(null)
      setError('')
      setView('form')
    } catch { setError('Error al cargar reporte') }
  }

  async function uploadImg(file: File): Promise<string> {
    const res = await fetch('/api/documentos/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, proyectoId, fileSize: file.size }),
    })
    if (!res.ok) throw new Error('Error al preparar subida')
    const { signedUrl, path } = await res.json()
    const up = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
    if (!up.ok) throw new Error('Error al subir imagen')
    return path
  }

  async function handleSave() {
    if (!form.codigo.trim()) { setError('Código es requerido'); return }
    setSaving(true); setError('')
    try {
      const srP    = logoSrFile ? await uploadImg(logoSrFile) : logoSrPath
      const clP    = logoClFile ? await uploadImg(logoClFile) : logoClPath
      const foto1P = foto1File  ? await uploadImg(foto1File)  : foto1Path
      const foto2P = foto2File  ? await uploadImg(foto2File)  : foto2Path
      const eleP   = eleFile    ? await uploadImg(eleFile)    : elePath

      const body = {
        ...form,
        logo_sr_path: srP, logo_cliente_path: clP,
        foto_registro_1_path: foto1P, foto_registro_2_path: foto2P,
        elevacion_path: eleP,
      }

      const url    = editingId ? `/api/reportes-malla/${editingId}` : `/api/proyectos/${proyectoId}/reportes-malla`
      const method = editingId ? 'PATCH' : 'POST'
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { setError('Error al guardar reporte'); return }

      const saved = await res.json()
      if (!editingId) setEditingId(saved.id)
      setLogoSrPath(srP); setLogoClPath(clP)
      setFoto1Path(foto1P); setFoto2Path(foto2P); setElePath(eleP)
      setLogoSrFile(null); setLogoClFile(null)
      setFoto1File(null); setFoto2File(null); setEleFile(null)
      await loadList()
    } catch (e: unknown) {
      setError((e as Error).message || 'Error al guardar')
    } finally { setSaving(false) }
  }

  async function fetchImgBase64(
    file: File | null, path: string | null, tipo: 'sr' | 'cliente' | 'foto1' | 'foto2' | 'elevacion'
  ): Promise<string | null> {
    if (file) return getBase64(file)
    if (path && editingId) {
      try {
        const res = await fetch(`/api/reportes-malla/${editingId}/imagen?tipo=${tipo}`)
        if (!res.ok) return null
        const { url } = await res.json()
        const imgRes = await fetch(url)
        if (!imgRes.ok) return null
        return blobToBase64(await imgRes.blob())
      } catch { return null }
    }
    return null
  }

  async function handleGeneratePDF() {
    setGenPdf(true); setError('')
    try {
      const [imgSr, imgCl, imgFoto1, imgFoto2, imgEle] = await Promise.all([
        fetchImgBase64(logoSrFile, logoSrPath, 'sr'),
        fetchImgBase64(logoClFile, logoClPath, 'cliente'),
        fetchImgBase64(foto1File,  foto1Path,  'foto1'),
        fetchImgBase64(foto2File,  foto2Path,  'foto2'),
        fetchImgBase64(eleFile,    elePath,     'elevacion'),
      ])

      const pdfData: MallaPDFData = {
        codigoDoc:       form.codigo,
        version:         form.version,
        fechaDoc:        form.fecha_doc,
        nombreProyecto:  proyectoNombre,
        especialista:    form.especialista,
        contratista:     form.contratista,
        entidad:         form.entidad,
        ubicacion:       form.ubicacion,
        estructura:      form.estructura,
        fecha:           form.fecha,
        nRegistro:       form.n_registro,
        planoReferencial: form.plano_referencial,
        nivelCorona:     form.nivel_corona,
        nivelPieTalud:   form.nivel_pie_talud,
        nColumnasMalla:  form.n_columnas_malla,
        malla: {
          tipo:           form.malla_tipo,
          marca:          form.malla_marca,
          abertura:       form.malla_abertura,
          diametroAlambre: form.malla_diametro_alambre,
          tipoUnion:      form.malla_tipo_union,
          norma:          form.malla_norma,
        },
        alambreCoser: {
          material:       form.alambre_material,
          diametro:       form.alambre_diametro,
          tensionRotura:  form.alambre_tension_rotura,
        },
        grapas: {
          material:       form.grapas_material,
          diametro:       form.grapas_diametro,
          tuercas:        form.grapas_tuercas,
        },
        instalacion: {
          fechaInstalacion:         form.inst_fecha,
          anchoRollo:               form.inst_ancho_rollo,
          alturaRolloFab:           form.inst_altura_rollo_fab,
          longitudProtegidaInicial: form.inst_long_prot_ini,
          alturaProtegerInicial:    form.inst_altura_prot_ini,
          longitudProtegidaFinal:   form.inst_long_prot_fin,
          alturaProtegerFinal:      form.inst_altura_prot_fin,
          areaProtegida:            form.inst_area_protegida,
          usoGrapas:                form.inst_uso_grapas,
        },
        imagenes: { logoSR: imgSr, logoCliente: imgCl, registroFotografico1: imgFoto1, registroFotografico2: imgFoto2, elevacionTalud: imgEle },
        firmas: { representanteSR: form.representante_sr, representanteContratista: form.representante_contratista },
      }

      await generateMallasPDF(pdfData)
    } catch (e) {
      console.error('[PDF Mallas]', e)
      setError('Error al generar PDF')
    } finally { setGenPdf(false) }
  }

  // ── Shared styles ────────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '6px 9px', fontSize: 12,
    border: '0.5px solid #e8eaed', borderRadius: 5,
    outline: 'none', color: '#1a1d1e', backgroundColor: '#fff',
    boxSizing: 'border-box',
  }
  const card: React.CSSProperties = {
    backgroundColor: '#fff', border: '0.5px solid #e8eaed',
    borderRadius: 10, padding: 16, marginBottom: 16,
  }
  const secTitle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#1a3a6e',
    marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em',
  }
  const set = (field: keyof MallaFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [field]: e.target.value }))

  // ── List view ────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>
            Protocolos de Instalación de Malla en Talud
          </span>
          <button onClick={openNew} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', fontSize: 12, fontWeight: 500,
            backgroundColor: '#1a3a6e', color: '#fff',
            border: 'none', borderRadius: 6, cursor: 'pointer',
          }}>
            <IconPlus size={13} /> Nuevo protocolo
          </button>
        </div>

        {loadingList ? (
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando...</p>
        ) : reportes.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            backgroundColor: '#fff', border: '0.5px solid #e8eaed', borderRadius: 10,
          }}>
            <IconFileDescription size={32} color="#e8eaed" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Sin protocolos generados aún</p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff', border: '0.5px solid #e8eaed', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '0.5px solid #e8eaed' }}>
                  {['Código', 'Versión', 'Fecha Doc.', 'N° Registro', 'Creado'].map(h => (
                    <th key={h} style={{
                      padding: '9px 14px', textAlign: 'left', fontWeight: 500,
                      color: '#9ca3af', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{h}</th>
                  ))}
                  <th style={{ padding: '9px 14px' }} />
                </tr>
              </thead>
              <tbody>
                {reportes.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < reportes.length - 1 ? '0.5px solid #f4f6f8' : 'none' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#1a1d1e' }}>{r.codigo}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>v{r.version}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{r.fecha_doc || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{r.n_registro || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#b0b7c3' }}>{new Date(r.created_at).toLocaleDateString('es-PE')}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button onClick={() => openEdit(r.id)}
                        style={{ fontSize: 12, color: '#1a3a6e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // ── Form view ─────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setView('list')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
            <IconArrowLeft size={14} /> Volver
          </button>
          <span style={{ color: '#e8eaed' }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>
            {editingId ? `Editar — ${form.codigo}` : 'Nuevo protocolo de malla'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={saving} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', fontSize: 12, fontWeight: 500,
            backgroundColor: '#eaf3de', color: '#3b6d11',
            border: 'none', borderRadius: 6,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          }}>
            <IconDeviceFloppy size={13} />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={handleGeneratePDF} disabled={genPdf} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', fontSize: 12, fontWeight: 500,
            backgroundColor: '#1a3a6e', color: '#fff',
            border: 'none', borderRadius: 6,
            cursor: genPdf ? 'not-allowed' : 'pointer', opacity: genPdf ? 0.6 : 1,
          }}>
            <IconDownload size={13} />
            {genPdf ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 12, padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: 6 }}>
          {error}
        </p>
      )}

      {/* Encabezado del documento */}
      <div style={card}>
        <p style={secTitle}>Encabezado del documento</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Código del documento">
            <input style={inp} value={form.codigo} onChange={set('codigo')} />
          </Field>
          <Field label="Versión">
            <input style={inp} value={form.version} placeholder="00" onChange={set('version')} />
          </Field>
          <Field label="Fecha del documento">
            <input style={inp} value={form.fecha_doc} placeholder="06.02.2023" onChange={set('fecha_doc')} />
          </Field>
        </div>
      </div>

      {/* Logos */}
      <div style={card}>
        <p style={secTitle}>Logos e imágenes</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 16 }}>
          <LogoZone label="Logo Soil Rock"        file={logoSrFile}  preview={logoSrPreview}  hasSaved={!!logoSrPath}  inputRef={srRef}
            onChange={f => { setLogoSrFile(f); setLogoSrPreview(URL.createObjectURL(f)) }} />
          <LogoZone label="Logo Cliente"           file={logoClFile}  preview={logoClPreview}  hasSaved={!!logoClPath}  inputRef={clRef}
            onChange={f => { setLogoClFile(f); setLogoClPreview(URL.createObjectURL(f)) }} />
          <LogoZone label="Registro Fotográfico 1"  file={foto1File}   preview={foto1Preview}   hasSaved={!!foto1Path}   inputRef={foto1Ref}
            onChange={f => { setFoto1File(f); setFoto1Preview(URL.createObjectURL(f)) }}
            hint="Se muestran lado a lado en el PDF" />
          <LogoZone label="Registro Fotográfico 2"  file={foto2File}   preview={foto2Preview}   hasSaved={!!foto2Path}   inputRef={foto2Ref}
            onChange={f => { setFoto2File(f); setFoto2Preview(URL.createObjectURL(f)) }}
            hint="Opcional — si solo hay una, ocupa todo el espacio" />
          <LogoZone label="Elevación de Talud"     file={eleFile}     preview={elePreview}     hasSaved={!!elePath}     inputRef={eleRef}
            onChange={f => { setEleFile(f); setElePreview(URL.createObjectURL(f)) }}
            hint="Perfil del talud — se muestra a página completa" />
        </div>
      </div>

      {/* Datos generales */}
      <div style={card}>
        <p style={secTitle}>Datos generales</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="Nombre del Proyecto">
            <input style={{ ...inp, backgroundColor: '#f9fafb', color: '#9ca3af' }} value={proyectoNombre} disabled />
          </Field>
          <Field label="Fecha">
            <input style={inp} value={form.fecha} onChange={set('fecha')} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="Especialista">
            <input style={inp} value={form.especialista} onChange={set('especialista')} />
          </Field>
          <Field label="N° Registro">
            <input style={inp} value={form.n_registro} onChange={set('n_registro')} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="Contratista">
            <input style={inp} value={form.contratista} onChange={set('contratista')} />
          </Field>
          <Field label="Plano Referencial">
            <input style={inp} value={form.plano_referencial} onChange={set('plano_referencial')} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="Entidad">
            <input style={inp} value={form.entidad} onChange={set('entidad')} />
          </Field>
          <Field label="Nivel de Corona">
            <input style={inp} value={form.nivel_corona} onChange={set('nivel_corona')} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="Ubicación">
            <input style={inp} value={form.ubicacion} onChange={set('ubicacion')} />
          </Field>
          <Field label="Nivel de Pie Talud">
            <input style={inp} value={form.nivel_pie_talud} onChange={set('nivel_pie_talud')} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Estructura">
            <input style={inp} value={form.estructura} onChange={set('estructura')} />
          </Field>
          <Field label="N° Columnas de Malla">
            <input style={inp} value={form.n_columnas_malla} onChange={set('n_columnas_malla')} />
          </Field>
        </div>
      </div>

      {/* Características de malla */}
      <div style={card}>
        <p style={secTitle}>Características de malla</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

          {/* Malla */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#1a3a6e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Malla</p>
            {([
              ['malla_tipo',             'Tipo'],
              ['malla_marca',            'Marca'],
              ['malla_abertura',         'Abertura'],
              ['malla_diametro_alambre', 'Diámetro Alambre'],
              ['malla_tipo_union',       'Tipo de Unión'],
              ['malla_norma',            'Norma'],
            ] as [keyof MallaFormState, string][]).map(([f, l]) => (
              <div key={f} style={{ marginBottom: 10 }}>
                <Field label={l}><input style={inp} value={form[f] as string} onChange={set(f)} /></Field>
              </div>
            ))}
          </div>

          {/* Alambre de coser */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#1a3a6e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alambre de Coser</p>
            {([
              ['alambre_material',        'Material'],
              ['alambre_diametro',        'Diámetro'],
              ['alambre_tension_rotura',  'Tensión de Rotura'],
            ] as [keyof MallaFormState, string][]).map(([f, l]) => (
              <div key={f} style={{ marginBottom: 10 }}>
                <Field label={l}><input style={inp} value={form[f] as string} onChange={set(f)} /></Field>
              </div>
            ))}
          </div>

          {/* Grapas */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#1a3a6e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grapas</p>
            {([
              ['grapas_material', 'Material'],
              ['grapas_diametro', 'Diámetro'],
              ['grapas_tuercas',  'Tuercas'],
            ] as [keyof MallaFormState, string][]).map(([f, l]) => (
              <div key={f} style={{ marginBottom: 10 }}>
                <Field label={l}><input style={inp} value={form[f] as string} onChange={set(f)} /></Field>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instalación */}
      <div style={card}>
        <p style={secTitle}>Instalación</p>
        <div style={{ marginBottom: 12 }}>
          <Field label="Fecha de Instalación">
            <input style={{ ...inp, maxWidth: 260 }} value={form.inst_fecha} onChange={set('inst_fecha')} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([
            ['inst_ancho_rollo',      'Ancho de Rollo (m.)'],
            ['inst_altura_rollo_fab', 'Altura de Rollo Fab. (m.)'],
            ['inst_long_prot_ini',    'Longitud Protegida Inicial (m.)'],
            ['inst_altura_prot_ini',  'Altura a Proteger Inicial (m.)'],
            ['inst_long_prot_fin',    'Longitud Protegida Final (m.)'],
            ['inst_altura_prot_fin',  'Altura a Proteger Final (m.)'],
            ['inst_area_protegida',   'Área Protegida (m²)'],
            ['inst_uso_grapas',       'Uso de Grapas (und.)'],
          ] as [keyof MallaFormState, string][]).map(([f, l]) => (
            <Field key={f} label={l}>
              <input style={inp} value={form[f] as string} onChange={set(f)} />
            </Field>
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>
          * El área indicada corresponde a un valor teórico estimado
        </p>
      </div>

      {/* Firmas */}
      <div style={card}>
        <p style={secTitle}>Firmas del protocolo</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Field label="Representante Soil Rock (nombre)">
              <input style={inp} value={form.representante_sr} placeholder="Nombre completo" onChange={set('representante_sr')} />
            </Field>
            <div style={{ marginTop: 10, borderTop: '1.5px solid #9ca3af', paddingTop: 6, fontSize: 11, color: '#6b7280' }}>
              Representante de Soil Rock S.A.C.
            </div>
          </div>
          <div>
            <Field label={`Representante ${clienteNombre || 'Contratista'} (nombre)`}>
              <input style={inp} value={form.representante_contratista} placeholder="Nombre completo" onChange={set('representante_contratista')} />
            </Field>
            <div style={{ marginTop: 10, borderTop: '1.5px solid #9ca3af', paddingTop: 6, fontSize: 11, color: '#6b7280' }}>
              Representante del Contratista
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span style={{
        fontSize: 10, fontWeight: 500, color: '#9ca3af',
        display: 'block', marginBottom: 3,
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {label}
      </span>
      {children}
    </div>
  )
}

function LogoZone({
  label, file, preview, hasSaved, inputRef, onChange, hint,
}: {
  label: string; file: File | null; preview: string | null; hasSaved: boolean
  inputRef: React.RefObject<HTMLInputElement | null>; onChange: (f: File) => void; hint?: string
}) {
  return (
    <div>
      <span style={{ fontSize: 10, fontWeight: 500, color: '#9ca3af', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <div onClick={() => inputRef.current?.click()} style={{
        border: '1.5px dashed #e8eaed', borderRadius: 8, padding: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', minHeight: 80, backgroundColor: '#f9fafb',
      }}>
        {preview ? (
          <img src={preview} alt="preview" style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }} />
        ) : hasSaved ? (
          <span style={{ fontSize: 12, color: '#3b6d11' }}>✓ Imagen guardada — click para reemplazar</span>
        ) : (
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Click para subir (PNG/JPG)</span>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); e.target.value = '' }} />
      {hint && !preview && !hasSaved && (
        <span style={{ fontSize: 10, color: '#b0b7c3', marginTop: 4, display: 'block' }}>{hint}</span>
      )}
    </div>
  )
}
