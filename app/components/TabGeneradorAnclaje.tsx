'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  IconPlus, IconTrash, IconDownload, IconDeviceFloppy,
  IconArrowLeft, IconFileDescription,
} from '@tabler/icons-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnclajeRow {
  id: string
  codigo: string
  hora_inicio: string
  hora_final: string
  delta_tiempo: string
  l_bulbo: string
  l_libre: string
  l_mecha: string
  l_total: string
  n_barras: string
  angulo_vertical: string
  angulo_horiz: string
  reubico: string
  dx: string
  dy: string
}

interface AnclajeFormState {
  codigo: string
  version: string
  fecha: string
  ubicacion: string
  metodologia: string
  sistema: string
  martillo_dth: string
  diametro_casing: string
  descripcion_suelo: string
  observaciones: string
  anclajes_perforados: string
  anclajes_acumulados: string
  perforadora_hidraulica: string
  compresora_aire: string
  supervisor: string
  oper_perforista: string
  oper_compresorista: string
  supervisor_obra: string
  ingeniero_civil: string
  col_variante: 'barras' | 'cables'
}

interface ReporteResumen {
  id: string
  codigo: string
  version: string
  fecha: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  anclajes: any[]
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newAnclajeRow(): AnclajeRow {
  return {
    id: typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()),
    codigo: '', hora_inicio: '', hora_final: '', delta_tiempo: '',
    l_bulbo: '', l_libre: '', l_mecha: '', l_total: '',
    n_barras: '', angulo_vertical: '', angulo_horiz: '',
    reubico: '', dx: '', dy: '',
  }
}

function formatFechaPDF(isoDate: string): string {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.slice(0, 10).split('-')
  return `${d}-${m}-${y}`
}

function decimalToHHMM(v: string | number): string {
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n) || v === '') return '—'
  const totalMin = Math.round(n * 24 * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const defaultForm: AnclajeFormState = {
  codigo: '', version: '', fecha: '',
  ubicacion: '', metodologia: '',
  sistema: '', martillo_dth: '', diametro_casing: '',
  descripcion_suelo: '', observaciones: '',
  anclajes_perforados: '0', anclajes_acumulados: '0',
  perforadora_hidraulica: '', compresora_aire: '',
  supervisor: '', oper_perforista: '', oper_compresorista: '',
  supervisor_obra: '', ingeniero_civil: '',
  col_variante: 'barras',
}

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

async function getImageDimensions(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve({ w: 1, h: 1 })
    img.src = src
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TabGeneradorAnclaje({
  proyectoId,
  proyectoNombre,
  clienteNombre,
  proyectoUbicacion = '',
}: {
  proyectoId: string
  proyectoNombre: string
  clienteNombre: string
  proyectoUbicacion?: string
}) {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [reportes, setReportes] = useState<ReporteResumen[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState<AnclajeFormState>(defaultForm)
  const [filas, setFilas] = useState<AnclajeRow[]>([newAnclajeRow()])

  const [logoSrFile, setLogoSrFile] = useState<File | null>(null)
  const [logoSrPreview, setLogoSrPreview] = useState<string | null>(null)
  const [logoSrPath, setLogoSrPath] = useState<string | null>(null)

  const [logoClienteFile, setLogoClienteFile] = useState<File | null>(null)
  const [logoClientePreview, setLogoClientePreview] = useState<string | null>(null)
  const [logoClientePath, setLogoClientePath] = useState<string | null>(null)

  const [esquemaFile, setEsquemaFile] = useState<File | null>(null)
  const [esquemaPreview, setEsquemaPreview] = useState<string | null>(null)
  const [esquemaPath, setEsquemaPath] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [genPdf, setGenPdf] = useState(false)
  const [error, setError] = useState('')

  const srInputRef = useRef<HTMLInputElement>(null)
  const clienteInputRef = useRef<HTMLInputElement>(null)
  const esquemaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadList() }, [proyectoId])

  async function loadList() {
    setLoadingList(true)
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/reportes-anclaje`)
      if (res.ok) setReportes(await res.json())
    } finally {
      setLoadingList(false)
    }
  }

  function openNew() {
    setEditingId(null)
    setForm({ ...defaultForm, fecha: new Date().toISOString().slice(0, 10), ubicacion: proyectoUbicacion })
    setFilas([newAnclajeRow()])
    setLogoSrFile(null); setLogoSrPreview(null); setLogoSrPath(null)
    setLogoClienteFile(null); setLogoClientePreview(null); setLogoClientePath(null)
    setEsquemaFile(null); setEsquemaPreview(null); setEsquemaPath(null)
    setError('')
    setView('form')
  }

  async function openEdit(id: string) {
    try {
      const res = await fetch(`/api/reportes-anclaje/${id}`)
      if (!res.ok) { setError('Error al cargar reporte'); return }
      const d = await res.json()
      setEditingId(id)
      setForm({
        codigo:              d.codigo,
        version:             d.version,
        fecha:               d.fecha.slice(0, 10),
        ubicacion:           d.ubicacion ?? '',
        metodologia:         d.metodologia ?? '',
        sistema:             d.sistema ?? '',
        martillo_dth:        d.martillo_dth ?? '',
        diametro_casing:     d.diametro_casing ?? '',
        descripcion_suelo:   d.descripcion_suelo ?? '',
        observaciones:       d.observaciones ?? '',
        anclajes_perforados: String(d.anclajes_perforados ?? 0),
        anclajes_acumulados: String(d.anclajes_acumulados ?? 0),
        perforadora_hidraulica: d.perforadora_hidraulica ?? '',
        compresora_aire:     d.compresora_aire ?? '',
        supervisor:          d.supervisor ?? '',
        oper_perforista:     d.oper_perforista ?? '',
        oper_compresorista:  d.oper_compresorista ?? '',
        supervisor_obra:     d.supervisor_obra ?? '',
        ingeniero_civil:     d.ingeniero_civil ?? '',
        col_variante:        (d.oficial_1 === 'cables' ? 'cables' : 'barras'),
      })
      setFilas(
        (Array.isArray(d.anclajes) ? d.anclajes : []).map((a: AnclajeRow) => ({
          ...a,
          id: a.id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now())),
        }))
      )
      setLogoSrPath(d.logo_sr_path ?? null)
      setLogoClientePath(d.logo_cliente_path ?? null)
      setEsquemaPath(d.esquema_path ?? null)
      setLogoSrFile(null); setLogoSrPreview(null)
      setLogoClienteFile(null); setLogoClientePreview(null)
      setEsquemaFile(null); setEsquemaPreview(null)
      setError('')
      setView('form')
    } catch {
      setError('Error al cargar reporte')
    }
  }

  async function uploadLogo(file: File): Promise<string> {
    const res = await fetch('/api/documentos/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, proyectoId, fileSize: file.size }),
    })
    if (!res.ok) throw new Error('Error al preparar subida de imagen')
    const { signedUrl, path } = await res.json()
    const up = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!up.ok) throw new Error('Error al subir imagen')
    return path
  }

  async function handleSave() {
    if (!form.codigo.trim() || !form.fecha) {
      setError('Código y fecha son requeridos')
      return
    }
    setSaving(true)
    setError('')
    try {
      const srPath  = logoSrFile     ? await uploadLogo(logoSrFile)     : logoSrPath
      const clPath  = logoClienteFile ? await uploadLogo(logoClienteFile) : logoClientePath
      const esqPath = esquemaFile    ? await uploadLogo(esquemaFile)    : esquemaPath

      const body = {
        ...form,
        fecha:               new Date(form.fecha).toISOString(),
        anclajes_perforados: parseInt(form.anclajes_perforados) || 0,
        anclajes_acumulados: parseInt(form.anclajes_acumulados) || 0,
        anclajes:            filas,
        oficial_1:           form.col_variante,
        logo_sr_path:        srPath,
        logo_cliente_path:   clPath,
        esquema_path:        esqPath,
      }

      const url    = editingId ? `/api/reportes-anclaje/${editingId}` : `/api/proyectos/${proyectoId}/reportes-anclaje`
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { setError('Error al guardar reporte'); return }

      const saved = await res.json()
      if (!editingId) setEditingId(saved.id)
      setLogoSrPath(srPath)
      setLogoClientePath(clPath)
      setEsquemaPath(esqPath)
      setLogoSrFile(null)
      setLogoClienteFile(null)
      setEsquemaFile(null)
      await loadList()
    } catch (e: unknown) {
      setError((e as Error).message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function fetchImageBase64(
    file: File | null,
    path: string | null,
    reporteId: string | null,
    tipo: 'sr' | 'cliente' | 'esquema'
  ): Promise<string | null> {
    if (file) return getBase64(file)
    if (path && reporteId) {
      try {
        const res = await fetch(`/api/reportes-anclaje/${reporteId}/logo?tipo=${tipo}`)
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
    setGenPdf(true)
    setError('')
    try {
      const { jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const W = 297
      const H = 210
      const M = 8
      const BOTTOM_M = 10
      const CW = W - M * 2

      const BLUE   = [26, 58, 110]   as [number, number, number]
      const LBLUE  = [232, 238, 246] as [number, number, number]
      const GRAY   = [107, 114, 128] as [number, number, number]
      const DARK   = [26, 29, 30]    as [number, number, number]
      const WHITE  = [255, 255, 255] as [number, number, number]
      const BORDER = [210, 215, 220] as [number, number, number]
      const ALT    = [249, 250, 251] as [number, number, number]

      const [imgSr, imgCl, imgEsq] = await Promise.all([
        fetchImageBase64(logoSrFile, logoSrPath, editingId, 'sr'),
        fetchImageBase64(logoClienteFile, logoClientePath, editingId, 'cliente'),
        fetchImageBase64(esquemaFile, esquemaPath, editingId, 'esquema'),
      ])

      const colMecha  = form.col_variante === 'cables' ? 'L.\nTensado'  : 'L.\nMecha'
      const colBarras = form.col_variante === 'cables' ? 'N°\nCables'   : 'N°\nBarras'

      let currentY = M

      // ── Header ──────────────────────────────────────────────────────────────
      const LOGO_W = 34
      const TITLE_W = CW - LOGO_W * 2
      const HDR_H = 22

      doc.setFillColor(...BLUE)
      doc.rect(M, currentY, CW, HDR_H, 'F')
      doc.setDrawColor(...BORDER)
      doc.setLineWidth(0.3)
      doc.rect(M, currentY, CW, HDR_H)
      doc.line(M + LOGO_W, currentY, M + LOGO_W, currentY + HDR_H)
      doc.line(M + LOGO_W + TITLE_W, currentY, M + LOGO_W + TITLE_W, currentY + HDR_H)

      if (imgSr) {
        try { doc.addImage(imgSr, M + 2, currentY + 2, LOGO_W - 4, HDR_H - 4, '', 'FAST') } catch { /**/ }
      } else {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...WHITE)
        doc.text('SOIL ROCK', M + LOGO_W / 2, currentY + HDR_H / 2, { align: 'center', baseline: 'middle' })
      }

      if (imgCl) {
        try { doc.addImage(imgCl, M + LOGO_W + TITLE_W + 2, currentY + 2, LOGO_W - 4, HDR_H - 4, '', 'FAST') } catch { /**/ }
      }

      const tCX = M + LOGO_W + TITLE_W / 2
      const tW  = TITLE_W - 4

      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...WHITE)
      const titleLines = doc.splitTextToSize('REPORTE DE PERFORACIÓN E INSTALACIÓN DE ANCLAJES TEMPORALES', tW)
      const lineH = 4.2
      const titleBlockH = titleLines.length * lineH + 1 + 6 + 1 + 3.5
      const titleStartY = currentY + (HDR_H - titleBlockH) / 2 + lineH
      doc.text(titleLines, tCX, titleStartY, { align: 'center' })
      let ty = titleStartY + titleLines.length * lineH + 1

      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...WHITE)
      doc.text(form.codigo || '—', tCX, ty, { align: 'center' })
      ty += 5.5

      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(200, 210, 230)
      doc.text(`Versión ${form.version || '—'} / Fecha ${formatFechaPDF(form.fecha)}`, tCX, ty, { align: 'center' })

      currentY += HDR_H + 2

      // ── Datos Generales ──────────────────────────────────────────────────────
      const half = CW / 2
      const LW  = 30, VW  = half - LW
      const LW2 = 36, VW2 = half - LW2

      autoTable(doc, {
        startY: currentY,
        body: [
          ['Proyecto:',              proyectoNombre || '—',      'Metodología:',         form.metodologia || '—'],
          ['Ubicación:',             form.ubicacion || '—',       'Sistema:',             form.sistema || '—'],
          ['Cliente:',               clienteNombre || '—',        'Martillo de fondo DTH:', form.martillo_dth || '—'],
          ['Fecha:',                 formatFechaPDF(form.fecha),  'Diámetro de Casing:',  form.diametro_casing || '—'],
        ],
        styles: {
          fontSize: 7.5, cellPadding: { top: 1.8, bottom: 1.8, left: 2.5, right: 2 },
          textColor: DARK, lineColor: BORDER, lineWidth: 0.2,
        },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: LW },
          1: { cellWidth: VW },
          2: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: LW2 },
          3: { cellWidth: VW2 },
        },
        margin: { left: M, right: M },
        showHead: 'never',
        theme: 'grid',
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable.finalY + 3

      // ── Tabla de Anclajes (full width, paginación automática) ────────────────
      // Anchos de columnas (suma = CW = 281):
      // 26+21+21+18+18+17+24+18+26+22+24+16+15+15 = 281
      const COL_W = {
        codigo:    26,
        h_ini:     21,
        h_fin:     21,
        dt:        18,
        l_bulbo:   18,
        l_libre:   17,
        l_mecha:   24,
        l_total:   18,
        n_barras:  26,
        ang_v:     22,
        ang_h:     24,
        reubico:   16,
        dx:        15,
        dy:        15,
      }

      autoTable(doc, {
        startY: currentY,
        head: [[
          { content: 'Código\nAnclaje',           styles: { halign: 'center' } },
          { content: 'Hora\nInicio',               styles: { halign: 'center' } },
          { content: 'Hora\nFinal',                styles: { halign: 'center' } },
          { content: 'Dif.\nTiempo',                 styles: { halign: 'center' } },
          { content: 'L.\nBulbo',                  styles: { halign: 'center' } },
          { content: 'L.\nLibre',                  styles: { halign: 'center' } },
          { content: colMecha,                      styles: { halign: 'center' } },
          { content: 'L.\nTotal',                  styles: { halign: 'center' } },
          { content: colBarras,                     styles: { halign: 'center' } },
          { content: 'Ángulo\nVertical',            styles: { halign: 'center' } },
          { content: 'Ángulo\nHoriz.',              styles: { halign: 'center' } },
          { content: 'Reubicó',                     styles: { halign: 'center' } },
          { content: 'D X',                         styles: { halign: 'center' } },
          { content: 'D Y',                         styles: { halign: 'center' } },
        ]],
        body: filas.map(r => [
          r.codigo || '',
          r.hora_inicio   ? decimalToHHMM(r.hora_inicio)   : '',
          r.hora_final    ? decimalToHHMM(r.hora_final)    : '',
          r.delta_tiempo  ? decimalToHHMM(r.delta_tiempo)  : '',
          r.l_bulbo       || '',
          r.l_libre       || '',
          r.l_mecha       || '',
          r.l_total       || '',
          r.n_barras      || '',
          r.angulo_vertical || '',
          r.angulo_horiz  || '',
          r.reubico       || '',
          r.dx            || '',
          r.dy            || '',
        ]),
        headStyles: {
          fillColor: BLUE, textColor: WHITE,
          fontStyle: 'bold', fontSize: 6,
          lineColor: [10, 30, 70], lineWidth: 0.2,
          minCellHeight: 10,
        },
        styles: {
          fontSize: 6.5, cellPadding: 1.6, textColor: DARK,
          lineColor: BORDER, lineWidth: 0.2, halign: 'center',
        },
        alternateRowStyles: { fillColor: ALT },
        columnStyles: {
          0:  { cellWidth: COL_W.codigo,   fontStyle: 'bold', halign: 'center' },
          1:  { cellWidth: COL_W.h_ini,    halign: 'center' },
          2:  { cellWidth: COL_W.h_fin,    halign: 'center' },
          3:  { cellWidth: COL_W.dt,       halign: 'center' },
          4:  { cellWidth: COL_W.l_bulbo,  halign: 'center' },
          5:  { cellWidth: COL_W.l_libre,  halign: 'center' },
          6:  { cellWidth: COL_W.l_mecha,  halign: 'center' },
          7:  { cellWidth: COL_W.l_total,  fontStyle: 'bold', textColor: BLUE, halign: 'center' },
          8:  { cellWidth: COL_W.n_barras, halign: 'center' },
          9:  { cellWidth: COL_W.ang_v,    halign: 'center' },
          10: { cellWidth: COL_W.ang_h,    halign: 'center' },
          11: { cellWidth: COL_W.reubico,  halign: 'center' },
          12: { cellWidth: COL_W.dx,       halign: 'center' },
          13: { cellWidth: COL_W.dy,       halign: 'center' },
        },
        margin: { left: M, right: M },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable.finalY + 4

      // ── Bloques de texto con salto de página automático ──────────────────────
      const drawTextBlock = (title: string, text: string, minH = 10) => {
        const lines = text.trim() ? doc.splitTextToSize(text, CW - 6) : ['—']
        const boxH = Math.max(lines.length * 4 + 4, minH)

        if (currentY + 5.5 + boxH + 3 > H - BOTTOM_M) {
          doc.addPage()
          currentY = M
        }

        doc.setFillColor(...BLUE); doc.setLineWidth(0)
        doc.rect(M, currentY, CW, 5.5, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...WHITE)
        doc.text(title, M + 3, currentY + 4)
        currentY += 5.5

        doc.setDrawColor(...BORDER); doc.setLineWidth(0.2)
        doc.rect(M, currentY, CW, boxH)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...DARK)
        doc.text(lines, M + 3, currentY + 4)
        currentY += boxH + 3
      }

      drawTextBlock('DESCRIPCIÓN DEL SUELO', form.descripcion_suelo, 12)
      drawTextBlock('OBSERVACIONES Y/O RESTRICCIONES', form.observaciones, 12)

      // ── Esquema + Leyenda (lado a lado) ─────────────────────────────────────
      const ESQ_W  = Math.round(CW * 0.65)
      const LEY_W  = CW - ESQ_W - 4
      const LEY_X  = M + ESQ_W + 4
      const ESQ_H  = 48

      if (currentY + ESQ_H + 3 > H - BOTTOM_M) {
        doc.addPage()
        currentY = M
      }

      // Esquema título
      doc.setFillColor(...BLUE); doc.setLineWidth(0)
      doc.rect(M, currentY, ESQ_W, 5.5, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(...WHITE)
      const esqTitleLines = doc.splitTextToSize('ESQUEMA DE DISTRIBUCIÓN EN PLANTA', ESQ_W - 4)
      doc.text(esqTitleLines, M + ESQ_W / 2, currentY + (esqTitleLines.length > 1 ? 2 : 3.5), { align: 'center' })

      // Esquema imagen
      const esqImgY = currentY + 5.5
      const esqImgH = ESQ_H - 5.5

      doc.setDrawColor(...BORDER); doc.setLineWidth(0.2)
      doc.rect(M, esqImgY, ESQ_W, esqImgH)

      if (imgEsq) {
        try {
          const dims = await getImageDimensions(imgEsq)
          const aspect = dims.w / dims.h
          let imgW = ESQ_W - 2
          let imgH = imgW / aspect
          if (imgH > esqImgH - 2) { imgH = esqImgH - 2; imgW = imgH * aspect }
          doc.addImage(imgEsq, M + (ESQ_W - imgW) / 2, esqImgY + (esqImgH - imgH) / 2, imgW, imgH)
        } catch { /**/ }
      } else {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...BLUE)
        const ph = doc.splitTextToSize('ESQUEMA DE DISTRIBUCIÓN EN PLANTA', ESQ_W - 10)
        doc.text(ph, M + ESQ_W / 2, esqImgY + esqImgH / 2, { align: 'center', baseline: 'middle' })
      }

      // Leyenda (derecha)
      const leyendaStartY = currentY
      autoTable(doc, {
        startY: leyendaStartY,
        body: [
          ['Anclajes perforados N°:', String(form.anclajes_perforados || '0')],
          ['Anclajes acumulados N°:', String(form.anclajes_acumulados || '0')],
        ],
        styles: {
          fontSize: 7.5, cellPadding: { top: 1.8, bottom: 1.8, left: 3, right: 3 },
          textColor: DARK, lineColor: BORDER, lineWidth: 0.2,
        },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: LEY_W - 20 },
          1: { fontStyle: 'bold', textColor: BLUE, halign: 'center', cellWidth: 20 },
        },
        margin: { left: LEY_X, right: M },
        showHead: 'never',
        theme: 'grid',
      })

      currentY = Math.max(
        esqImgY + esqImgH,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (doc as any).lastAutoTable.finalY
      ) + 4

      // ── Equipo de Perforación + Resumen Técnico ──────────────────────────────
      const EQ_W  = CW / 2
      const RES_W = CW - EQ_W

      // longitud efectiva = suma de l_total
      const longitudEfectiva = filas.reduce((s, r) => s + (parseFloat(r.l_total) || 0), 0)
      // tiempo efectivo = suma de delta_tiempo en decimal → HH:MM
      const tiempoDecimalTotal = filas.reduce((s, r) => s + (parseFloat(r.delta_tiempo) || 0), 0)
      const tiempoEfectivoStr = decimalToHHMM(tiempoDecimalTotal)

      const equipoNeeded = 5.5 + 5 * 8.8 + 4
      if (currentY + equipoNeeded > H - BOTTOM_M) {
        doc.addPage()
        currentY = M
      }

      doc.setFillColor(...BLUE); doc.setLineWidth(0)
      doc.rect(M, currentY, EQ_W, 5.5, 'F')
      doc.rect(M + EQ_W, currentY, RES_W, 5.5, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...WHITE)
      doc.text('EQUIPO DE PERFORACIÓN', M + 3, currentY + 4)
      doc.text('RESUMEN TÉCNICO', M + EQ_W + 3, currentY + 4)
      currentY += 5.5

      const eqStartY = currentY

      autoTable(doc, {
        startY: eqStartY,
        body: [
          ['Perforadora Hidráulica:', form.perforadora_hidraulica || '—'],
          ['Compresora de Aire:',     form.compresora_aire        || '—'],
          ['Supervisor:',             form.supervisor              || '—'],
          ['Oper. Perforista:',       form.oper_perforista         || '—'],
          ['Oper. Compresorista:',    form.oper_compresorista      || '—'],
        ],
        styles: { fontSize: 7, cellPadding: 1.6, textColor: DARK, lineColor: BORDER, lineWidth: 0.2 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: 42 },
          1: { cellWidth: EQ_W - 42 },
        },
        margin: { left: M, right: W - M - EQ_W },
        showHead: 'never',
        theme: 'grid',
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eqEndY = (doc as any).lastAutoTable.finalY

      autoTable(doc, {
        startY: eqStartY,
        body: [
          ['N° anclajes instalados:',        `${filas.length} und`],
          ['Longitud efectiva instalada:',    `${longitudEfectiva.toFixed(2)} m`],
          ['Tiempo efectivo de trabajo:',     `${tiempoEfectivoStr} h`],
        ],
        styles: { fontSize: 7, cellPadding: 1.6, textColor: DARK, lineColor: BORDER, lineWidth: 0.2 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: RES_W - 28 },
          1: { cellWidth: 28, fontStyle: 'bold', textColor: BLUE, halign: 'right' },
        },
        margin: { left: M + EQ_W, right: M },
        showHead: 'never',
        theme: 'grid',
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resEndY = (doc as any).lastAutoTable.finalY
      currentY = Math.max(eqEndY, resEndY) + 4

      // ── Firmas ───────────────────────────────────────────────────────────────
      const FW = CW / 2
      const FH = 22

      if (currentY + 5.5 + FH + 4 > H - BOTTOM_M) {
        doc.addPage()
        currentY = M
      }

      const firmas = [
        { empresa: 'SOIL ROCK S.A.C.',   nombre: form.supervisor_obra,  titulo: 'Supervisor Soil Rock' },
        { empresa: clienteNombre || '—', nombre: form.ingeniero_civil,  titulo: 'Supervisor del Cliente' },
      ]

      firmas.forEach((firma, i) => {
        const fx = M + i * FW
        doc.setFillColor(...BLUE); doc.setLineWidth(0)
        doc.rect(fx, currentY, FW, 5.5, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(...WHITE)
        const empLines = doc.splitTextToSize(firma.empresa, FW - 4)
        doc.text(empLines, fx + FW / 2, currentY + (empLines.length > 1 ? 1.8 : 3.8), { align: 'center' })

        doc.setDrawColor(...BORDER); doc.setLineWidth(0.25)
        doc.rect(fx, currentY + 5.5, FW, FH)

        const sigY = currentY + 5.5 + FH * 0.65
        if (firma.nombre) {
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...DARK)
          const nombreLines = doc.splitTextToSize(firma.nombre, FW - 8)
          const nombreStartY = sigY - (nombreLines.length > 1 ? nombreLines.length * 3.2 : 3.5)
          doc.text(nombreLines, fx + FW / 2, nombreStartY, { align: 'center' })
        }

        doc.setDrawColor(160, 170, 185); doc.setLineWidth(0.5)
        doc.line(fx + 5, sigY, fx + FW - 5, sigY)

        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...GRAY)
        doc.text(firma.titulo, fx + FW / 2, sigY + 4.5, { align: 'center' })
      })

      const filename = `${form.codigo || 'reporte-anclaje'}_V${form.version || '00'}_${form.fecha || 'fecha'}.pdf`
      doc.save(filename)
    } catch (e) {
      console.error('[PDF Anclaje]', e)
      setError('Error al generar PDF')
    } finally {
      setGenPdf(false)
    }
  }

  function setFila(id: string, field: keyof AnclajeRow, value: string) {
    setFilas(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const resumen = useMemo(() => ({
    nAnclajes:         filas.length,
    longitudEfectiva:  filas.reduce((s, r) => s + (parseFloat(r.l_total) || 0), 0).toFixed(2),
    tiempoEfectivo:    decimalToHHMM(filas.reduce((s, r) => s + (parseFloat(r.delta_tiempo) || 0), 0)),
  }), [filas])

  // ── Shared styles ──
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

  // ── List view ──────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>
            Reportes de Perforación e Instalación de Anclajes
          </span>
          <button
            onClick={openNew}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', fontSize: 12, fontWeight: 500,
              backgroundColor: '#1a3a6e', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer',
            }}
          >
            <IconPlus size={13} /> Nuevo reporte
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
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Sin reportes generados aún</p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff', border: '0.5px solid #e8eaed', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '0.5px solid #e8eaed' }}>
                  {['Código', 'Versión', 'Fecha', 'N° Anclajes', 'Creado'].map(h => (
                    <th key={h} style={{
                      padding: '9px 14px', textAlign: 'left',
                      fontWeight: 500, color: '#9ca3af', fontSize: 10,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{h}</th>
                  ))}
                  <th style={{ padding: '9px 14px' }} />
                </tr>
              </thead>
              <tbody>
                {reportes.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < reportes.length - 1 ? '0.5px solid #f4f6f8' : 'none' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#1a1d1e', fontSize: 12 }}>{r.codigo}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>v{r.version}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>
                      {new Date(r.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{Array.isArray(r.anclajes) ? r.anclajes.length : 0}</td>
                    <td style={{ padding: '10px 14px', color: '#b0b7c3' }}>
                      {new Date(r.created_at).toLocaleDateString('es-PE')}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => openEdit(r.id)}
                        style={{ fontSize: 12, color: '#1a3a6e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                      >
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

  // ── Form view ──────────────────────────────────────────────────────────────
  const colMechaLabel  = form.col_variante === 'cables' ? 'L. Tensado' : 'L. Mecha'
  const colBarrasLabel = form.col_variante === 'cables' ? 'N° Cables'  : 'N° Barras'

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setView('list')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <IconArrowLeft size={14} /> Volver
          </button>
          <span style={{ color: '#e8eaed' }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e' }}>
            {editingId ? `Editar — ${form.codigo}` : 'Nuevo reporte de perforación'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSave} disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', fontSize: 12, fontWeight: 500,
              backgroundColor: '#eaf3de', color: '#3b6d11',
              border: 'none', borderRadius: 6,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            }}
          >
            <IconDeviceFloppy size={13} />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={handleGeneratePDF} disabled={genPdf}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', fontSize: 12, fontWeight: 500,
              backgroundColor: '#1a3a6e', color: '#fff',
              border: 'none', borderRadius: 6,
              cursor: genPdf ? 'not-allowed' : 'pointer', opacity: genPdf ? 0.6 : 1,
            }}
          >
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

      {/* Datos generales */}
      <div style={card}>
        <p style={secTitle}>Datos generales</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="Código del documento">
            <input style={inp} value={form.codigo} placeholder="SG-CA-001"
              onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} />
          </Field>
          <Field label="Versión">
            <input style={inp} value={form.version} placeholder="003"
              onChange={e => setForm(p => ({ ...p, version: e.target.value }))} />
          </Field>
          <Field label="Fecha del reporte">
            <input type="date" style={inp} value={form.fecha}
              onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="Proyecto">
            <input style={{ ...inp, backgroundColor: '#f9fafb', color: '#9ca3af' }} value={proyectoNombre} disabled />
          </Field>
          <Field label="Cliente">
            <input style={{ ...inp, backgroundColor: '#f9fafb', color: '#9ca3af' }} value={clienteNombre} disabled />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <Field label="Ubicación">
            <input style={inp} value={form.ubicacion}
              onChange={e => setForm(p => ({ ...p, ubicacion: e.target.value }))} />
          </Field>
          <Field label="Metodología">
            <input style={inp} value={form.metodologia} placeholder="Perforación Rotopercusiva"
              onChange={e => setForm(p => ({ ...p, metodologia: e.target.value }))} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Sistema">
            <input style={inp} value={form.sistema} placeholder='Perforación concéntrica (Broca + Corona)'
              onChange={e => setForm(p => ({ ...p, sistema: e.target.value }))} />
          </Field>
          <Field label="Martillo de fondo DTH">
            <input style={inp} value={form.martillo_dth} placeholder="Simplex"
              onChange={e => setForm(p => ({ ...p, martillo_dth: e.target.value }))} />
          </Field>
          <Field label='Diámetro de Casing'>
            <input style={inp} value={form.diametro_casing} placeholder='127 mm (5")'
              onChange={e => setForm(p => ({ ...p, diametro_casing: e.target.value }))} />
          </Field>
        </div>
      </div>

      {/* Logos y esquema */}
      <div style={card}>
        <p style={secTitle}>Logos y esquema de planta</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <LogoZone
            label="Logo Soil Rock"
            file={logoSrFile} preview={logoSrPreview} hasSaved={!!logoSrPath}
            inputRef={srInputRef}
            onChange={f => { setLogoSrFile(f); setLogoSrPreview(URL.createObjectURL(f)) }}
          />
          <LogoZone
            label="Logo Cliente (opcional)"
            file={logoClienteFile} preview={logoClientePreview} hasSaved={!!logoClientePath}
            inputRef={clienteInputRef}
            onChange={f => { setLogoClienteFile(f); setLogoClientePreview(URL.createObjectURL(f)) }}
          />
          <LogoZone
            label="Imagen del esquema de planta"
            file={esquemaFile} preview={esquemaPreview} hasSaved={!!esquemaPath}
            inputRef={esquemaInputRef}
            onChange={f => { setEsquemaFile(f); setEsquemaPreview(URL.createObjectURL(f)) }}
            hint="Aparece bajo la tabla en el PDF"
          />
        </div>
      </div>

      {/* Tipo de anclaje / variante de columnas */}
      <div style={card}>
        <p style={secTitle}>Tipo de anclaje</p>
        <div style={{ display: 'flex', gap: 12 }}>
          {(['barras', 'cables'] as const).map(v => (
            <button
              key={v}
              onClick={() => setForm(p => ({ ...p, col_variante: v }))}
              style={{
                padding: '7px 18px', fontSize: 12, fontWeight: 500, borderRadius: 6,
                cursor: 'pointer',
                backgroundColor: form.col_variante === v ? '#1a3a6e' : '#f9fafb',
                color:           form.col_variante === v ? '#fff'     : '#6b7280',
                border:          form.col_variante === v ? 'none'     : '0.5px solid #e8eaed',
              }}
            >
              {v === 'barras' ? 'Barras (L. Mecha / N° Barras)' : 'Cables — tipo 3.xx (L. Tensado / N° Cables)'}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>
          Esto cambia los encabezados de columna en la tabla y el PDF.
        </p>
      </div>

      {/* Tabla de anclajes */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ ...secTitle, margin: 0 }}>Tabla de anclajes</p>
          <button
            onClick={() => setFilas(p => [...p, newAnclajeRow()])}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: '#1a3a6e',
              background: 'none', border: '0.5px solid #1a3a6e',
              borderRadius: 5, padding: '4px 10px', cursor: 'pointer',
            }}
          >
            <IconPlus size={12} /> Agregar fila
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8, marginTop: -8 }}>
          Las horas (Inicio / Final / Dif. Tiempo) se ingresan como fracción decimal de día (formato Excel). Ej: 0.4993 → 11:59
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr style={{ backgroundColor: '#1a3a6e' }}>
                {[
                  'Código', 'Hora Inicio', 'Hora Final', 'Dif. Tiempo',
                  'L. Bulbo', 'L. Libre', colMechaLabel, 'L. Total',
                  colBarrasLabel, 'Áng. Vertical', 'Áng. Horiz.', 'Reubicó', 'D X', 'D Y', '',
                ].map(h => (
                  <th key={h} style={{
                    padding: '6px 5px', textAlign: 'center',
                    color: '#fff', fontWeight: 500, fontSize: 9,
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((r, i) => {
                const bg = i % 2 === 0 ? '#fff' : '#f9fafb'
                const ci: React.CSSProperties = {
                  width: '100%', padding: '3px 4px', fontSize: 10,
                  border: '0.5px solid #e8eaed', borderRadius: 3,
                  outline: 'none', backgroundColor: '#fff', color: '#1a1d1e',
                  boxSizing: 'border-box', textAlign: 'center',
                }
                const td: React.CSSProperties = {
                  padding: '2px', backgroundColor: bg,
                  borderBottom: '0.5px solid #f4f6f8',
                }
                const numCi = { ...ci, width: 62 }
                return (
                  <tr key={r.id}>
                    <td style={td}><input style={{ ...ci, width: 72 }} value={r.codigo} placeholder="A1.08" onChange={e => setFila(r.id, 'codigo', e.target.value)} /></td>
                    <td style={td}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <input style={numCi} value={r.hora_inicio} placeholder="0.4993" onChange={e => setFila(r.id, 'hora_inicio', e.target.value)} />
                        {r.hora_inicio && <span style={{ fontSize: 8, color: '#6b7280' }}>{decimalToHHMM(r.hora_inicio)}</span>}
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <input style={numCi} value={r.hora_final} placeholder="0.5000" onChange={e => setFila(r.id, 'hora_final', e.target.value)} />
                        {r.hora_final && <span style={{ fontSize: 8, color: '#6b7280' }}>{decimalToHHMM(r.hora_final)}</span>}
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <input style={numCi} value={r.delta_tiempo} placeholder="0.0007" onChange={e => setFila(r.id, 'delta_tiempo', e.target.value)} />
                        {r.delta_tiempo && <span style={{ fontSize: 8, color: '#6b7280' }}>{decimalToHHMM(r.delta_tiempo)}</span>}
                      </div>
                    </td>
                    <td style={td}><input style={numCi} value={r.l_bulbo} placeholder="0.00" onChange={e => setFila(r.id, 'l_bulbo', e.target.value)} /></td>
                    <td style={td}><input style={numCi} value={r.l_libre} placeholder="0.00" onChange={e => setFila(r.id, 'l_libre', e.target.value)} /></td>
                    <td style={td}><input style={numCi} value={r.l_mecha} placeholder="0.00" onChange={e => setFila(r.id, 'l_mecha', e.target.value)} /></td>
                    <td style={td}><input style={{ ...numCi, fontWeight: 600, color: '#1a3a6e' }} value={r.l_total} placeholder="0.00" onChange={e => setFila(r.id, 'l_total', e.target.value)} /></td>
                    <td style={td}><input style={numCi} value={r.n_barras} placeholder="1" onChange={e => setFila(r.id, 'n_barras', e.target.value)} /></td>
                    <td style={td}><input style={numCi} value={r.angulo_vertical} placeholder="0°" onChange={e => setFila(r.id, 'angulo_vertical', e.target.value)} /></td>
                    <td style={td}><input style={numCi} value={r.angulo_horiz} placeholder="0°" onChange={e => setFila(r.id, 'angulo_horiz', e.target.value)} /></td>
                    <td style={td}><input style={{ ...numCi, width: 50 }} value={r.reubico} placeholder="No" onChange={e => setFila(r.id, 'reubico', e.target.value)} /></td>
                    <td style={td}><input style={numCi} value={r.dx} placeholder="0.00" onChange={e => setFila(r.id, 'dx', e.target.value)} /></td>
                    <td style={td}><input style={numCi} value={r.dy} placeholder="0.00" onChange={e => setFila(r.id, 'dy', e.target.value)} /></td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <button onClick={() => setFilas(p => p.filter(x => x.id !== r.id))}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 3 }}>
                        <IconTrash size={12} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Descripción + Observaciones */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <p style={secTitle}>Descripción del suelo</p>
          <textarea rows={4} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
            value={form.descripcion_suelo}
            onChange={e => setForm(p => ({ ...p, descripcion_suelo: e.target.value }))}
            placeholder="Descripción de las condiciones del suelo..." />
        </div>
        <div style={card}>
          <p style={secTitle}>Observaciones y/o restricciones</p>
          <textarea rows={4} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
            value={form.observaciones}
            onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))}
            placeholder="Observaciones del trabajo realizado..." />
        </div>
      </div>

      {/* Leyenda */}
      <div style={card}>
        <p style={secTitle}>Leyenda</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Anclajes perforados (día)">
            <input type="number" style={inp} value={form.anclajes_perforados}
              onChange={e => setForm(p => ({ ...p, anclajes_perforados: e.target.value }))} />
          </Field>
          <Field label="Anclajes acumulados">
            <input type="number" style={inp} value={form.anclajes_acumulados}
              onChange={e => setForm(p => ({ ...p, anclajes_acumulados: e.target.value }))} />
          </Field>
        </div>
      </div>

      {/* Equipo de perforación */}
      <div style={card}>
        <p style={secTitle}>Equipo de perforación</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([
            ['perforadora_hidraulica', 'Perforadora Hidráulica'],
            ['compresora_aire',        'Compresora de Aire'],
            ['supervisor',             'Supervisor'],
            ['oper_perforista',        'Oper. Perforista'],
            ['oper_compresorista',     'Oper. Compresorista'],
          ] as [keyof AnclajeFormState, string][]).map(([field, label]) => (
            <Field key={field} label={label}>
              <input style={inp} value={form[field] as string}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
            </Field>
          ))}
        </div>
      </div>

      {/* Resumen técnico */}
      <div style={{ ...card, backgroundColor: '#eef2f9', border: '0.5px solid #1a3a6e22', marginBottom: 16 }}>
        <p style={secTitle}>Resumen técnico</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <KPI label="N° anclajes instalados"       value={`${resumen.nAnclajes} und`} />
          <KPI label="Longitud efectiva instalada"  value={`${resumen.longitudEfectiva} m`} />
          <KPI label="Tiempo efectivo de trabajo"   value={`${resumen.tiempoEfectivo} h`} />
        </div>
      </div>

      {/* Firmas */}
      <div style={card}>
        <p style={secTitle}>Firmas del reporte</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Field label="Firma Supervisor Soil Rock (nombre)">
              <input style={inp} value={form.supervisor_obra} placeholder="Nombre completo"
                onChange={e => setForm(p => ({ ...p, supervisor_obra: e.target.value }))} />
            </Field>
            <div style={{ marginTop: 10, borderTop: '1.5px solid #9ca3af', paddingTop: 6, fontSize: 11, color: '#6b7280' }}>
              Supervisor Soil Rock
            </div>
          </div>
          <div>
            <Field label="Firma Supervisor Cliente (nombre)">
              <input style={inp} value={form.ingeniero_civil} placeholder="Nombre completo"
                onChange={e => setForm(p => ({ ...p, ingeniero_civil: e.target.value }))} />
            </Field>
            <div style={{ marginTop: 10, borderTop: '1.5px solid #9ca3af', paddingTop: 6, fontSize: 11, color: '#6b7280' }}>
              Supervisor del Cliente
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

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: 8, padding: '10px 14px',
      border: '0.5px solid #1a3a6e22',
    }}>
      <span style={{
        fontSize: 10, fontWeight: 500, color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4,
      }}>
        {label}
      </span>
      <span style={{ fontSize: 18, fontWeight: 700, color: '#1a3a6e' }}>{value}</span>
    </div>
  )
}

function LogoZone({
  label, file, preview, hasSaved, inputRef, onChange, hint,
}: {
  label: string
  file: File | null
  preview: string | null
  hasSaved: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (f: File) => void
  hint?: string
}) {
  return (
    <div>
      <span style={{
        fontSize: 10, fontWeight: 500, color: '#9ca3af',
        display: 'block', marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {label}
      </span>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: '1.5px dashed #e8eaed', borderRadius: 8, padding: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', minHeight: 80, backgroundColor: '#f9fafb',
        }}
      >
        {preview ? (
          <img src={preview} alt="preview" style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain' }} />
        ) : hasSaved ? (
          <span style={{ fontSize: 12, color: '#3b6d11' }}>✓ Imagen guardada — click para reemplazar</span>
        ) : (
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Click para subir imagen (PNG/JPG)</span>
        )}
      </div>
      <input
        ref={inputRef} type="file" accept="image/png,image/jpeg"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) onChange(f)
          e.target.value = ''
        }}
      />
      {hint && !preview && !hasSaved && (
        <span style={{ fontSize: 10, color: '#b0b7c3', marginTop: 4, display: 'block' }}>{hint}</span>
      )}
      {(file || preview) && (
        <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, display: 'block' }}>
          {file ? file.name : 'Imagen cargada desde guardado anterior'}
        </span>
      )}
    </div>
  )
}
