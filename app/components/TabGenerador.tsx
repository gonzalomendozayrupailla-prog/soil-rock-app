'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  IconPlus, IconTrash, IconDownload, IconDeviceFloppy,
  IconArrowLeft, IconFileDescription,
} from '@tabler/icons-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface InyeccionFila {
  id: string
  codigo: string
  consumo_boca: string
  total: string
  estado: string
}

interface InyeccionFormState {
  codigo: string
  version: string
  fecha: string
  ubicacion: string
  metodologia: string
  fluido: string
  cemento: string
  aditivo: string
  descripcion_suelo: string
  observaciones: string
  central_inyeccion: string
  supervisor: string
  oper_perforista: string
  oper_inyeccion: string
  anclajes_inyectados: string
  anclajes_acumulados: string
  supervisor_sr: string
  supervisor_cliente_nombre: string
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

function newInyeccionRow(): InyeccionFila {
  return {
    id: typeof crypto !== 'undefined' ? crypto.randomUUID() : String(Date.now()),
    codigo: '', consumo_boca: '', total: '', estado: '',
  }
}

function formatFechaPDF(isoDate: string): string {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.slice(0, 10).split('-')
  return `${d}-${m}-${y}`
}

const defaultForm: InyeccionFormState = {
  codigo: '', version: '', fecha: '',
  ubicacion: '', metodologia: '',
  fluido: '', cemento: '', aditivo: '',
  descripcion_suelo: '', observaciones: '',
  central_inyeccion: '', supervisor: '',
  oper_perforista: '', oper_inyeccion: '',
  anclajes_inyectados: '0', anclajes_acumulados: '0',
  supervisor_sr: '', supervisor_cliente_nombre: '',
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

export default function TabGenerador({
  proyectoId,
  proyectoNombre,
  clienteNombre,
}: {
  proyectoId: string
  proyectoNombre: string
  clienteNombre: string
}) {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [reportes, setReportes] = useState<ReporteResumen[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState<InyeccionFormState>(defaultForm)
  const [filas, setFilas] = useState<InyeccionFila[]>([newInyeccionRow()])

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
      const res = await fetch(`/api/proyectos/${proyectoId}/reportes-inyeccion`)
      if (res.ok) setReportes(await res.json())
    } finally {
      setLoadingList(false)
    }
  }

  function openNew() {
    setEditingId(null)
    setForm({ ...defaultForm, fecha: new Date().toISOString().slice(0, 10) })
    setFilas([newInyeccionRow()])
    setLogoSrFile(null); setLogoSrPreview(null); setLogoSrPath(null)
    setLogoClienteFile(null); setLogoClientePreview(null); setLogoClientePath(null)
    setEsquemaFile(null); setEsquemaPreview(null); setEsquemaPath(null)
    setError('')
    setView('form')
  }

  async function openEdit(id: string) {
    try {
      const res = await fetch(`/api/reportes-inyeccion/${id}`)
      if (!res.ok) { setError('Error al cargar reporte'); return }
      const d = await res.json()
      setEditingId(id)
      setForm({
        codigo: d.codigo,
        version: d.version,
        fecha: d.fecha.slice(0, 10),
        ubicacion: d.ubicacion ?? '',
        metodologia: d.metodologia ?? '',
        fluido: d.fluido ?? '',
        cemento: d.cemento ?? '',
        aditivo: d.aditivo ?? '',
        descripcion_suelo: d.descripcion_suelo ?? '',
        observaciones: d.observaciones ?? '',
        central_inyeccion: d.central_inyeccion ?? '',
        supervisor: d.supervisor ?? '',
        oper_perforista: d.oper_perforista ?? '',
        oper_inyeccion: d.oper_inyeccion ?? '',
        anclajes_inyectados: String(d.anclajes_inyectados ?? 0),
        anclajes_acumulados: String(d.anclajes_acumulados ?? 0),
        supervisor_sr: d.supervisor_sr ?? '',
        supervisor_cliente_nombre: d.supervisor_cliente ?? '',
      })
      setFilas(
        (d.anclajes as InyeccionFila[]).map(a => ({
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
        fecha: new Date(form.fecha).toISOString(),
        anclajes_inyectados: parseInt(form.anclajes_inyectados) || 0,
        anclajes_acumulados: parseInt(form.anclajes_acumulados) || 0,
        anclajes: filas,
        logo_sr_path: srPath,
        logo_cliente_path: clPath,
        esquema_path: esqPath,
        supervisor_cliente: form.supervisor_cliente_nombre,
      }

      const url    = editingId ? `/api/reportes-inyeccion/${editingId}` : `/api/proyectos/${proyectoId}/reportes-inyeccion`
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
        const res = await fetch(`/api/reportes-inyeccion/${reporteId}/logo?tipo=${tipo}`)
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
      const M = 8
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

      const COL_GAP = 4
      const LCW = Math.round(CW * 0.60)
      const RCW = CW - LCW - COL_GAP
      const RX  = M + LCW + COL_GAP

      let y = M

      // ── Header ──
      const LOGO_W  = 34
      const TITLE_W = LCW - LOGO_W * 2
      const HDR_H   = 22

      doc.setFillColor(...BLUE)
      doc.rect(M, y, LCW, HDR_H, 'F')
      doc.setDrawColor(...BORDER)
      doc.setLineWidth(0.3)
      doc.rect(M, y, LCW, HDR_H)
      doc.line(M + LOGO_W, y, M + LOGO_W, y + HDR_H)
      doc.line(M + LOGO_W + TITLE_W, y, M + LOGO_W + TITLE_W, y + HDR_H)

      if (imgSr) {
        try { doc.addImage(imgSr, M + 2, y + 2, LOGO_W - 4, HDR_H - 4, '', 'FAST') } catch { /**/ }
      } else {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...WHITE)
        doc.text('SOIL ROCK', M + LOGO_W / 2, y + HDR_H / 2, { align: 'center', baseline: 'middle' })
      }

      if (imgCl) {
        try { doc.addImage(imgCl, M + LOGO_W + TITLE_W + 2, y + 2, LOGO_W - 4, HDR_H - 4, '', 'FAST') } catch { /**/ }
      }

      const tCX = M + LOGO_W + TITLE_W / 2
      const tW  = TITLE_W - 4

      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...WHITE)
      const titleLines = doc.splitTextToSize('REPORTE DE INYECCIÓN PARA ANCLAJES', tW)
      const lineH = 4.5
      const titleBlockH = titleLines.length * lineH + 1 + 6 + 1 + 3.5
      const titleStartY = y + (HDR_H - titleBlockH) / 2 + lineH
      doc.text(titleLines, tCX, titleStartY, { align: 'center' })
      let ty = titleStartY + titleLines.length * lineH + 1

      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...WHITE)
      doc.text(form.codigo || '—', tCX, ty, { align: 'center' })
      ty += 5.5

      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(200, 210, 230)
      doc.text(`Versión ${form.version || '—'} / Fecha ${formatFechaPDF(form.fecha)}`, tCX, ty, { align: 'center' })

      y += HDR_H + 2

      // ── Datos generales ──
      const half = LCW / 2
      const LW  = 26, VW  = half - LW
      const LW2 = 30, VW2 = half - LW2

      autoTable(doc, {
        startY: y,
        body: [
          ['Proyecto:',  proyectoNombre || '—', 'Metodología:', form.metodologia || '—'],
          ['Ubicación:', form.ubicacion || '—',  'Fluido:',      form.fluido || '—'],
          ['Cliente:',   clienteNombre || '—',   'Cemento:',     form.cemento || '—'],
          ['Fecha:',     formatFechaPDF(form.fecha), 'Aditivo:', form.aditivo || '—'],
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
        margin: { left: M, right: W - M - LCW },
        showHead: 'never',
        theme: 'grid',
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 3

      // ── Tabla de anclajes (60% izquierda) ──
      const totalBls = filas.reduce((s, a) => s + (parseFloat(a.total) || 0), 0)

      autoTable(doc, {
        startY: y,
        head: [[
          { content: 'Código Anclaje',                               styles: { halign: 'center' } },
          { content: 'Consumo de Cemento\npor Manguera en Boca (Bls)', styles: { halign: 'center' } },
          { content: 'Total\n(Bls)',                                  styles: { halign: 'center' } },
          { content: 'Estado',                                        styles: { halign: 'center' } },
        ]],
        body: filas.map(a => [a.codigo || '', a.consumo_boca || '', a.total || '', a.estado || '']),
        headStyles: {
          fillColor: BLUE, textColor: WHITE,
          fontStyle: 'bold', fontSize: 6.5,
          lineColor: [10, 30, 70], lineWidth: 0.2,
        },
        styles: {
          fontSize: 6.5, cellPadding: 1.8, textColor: DARK,
          lineColor: BORDER, lineWidth: 0.2,
        },
        alternateRowStyles: { fillColor: ALT },
        columnStyles: {
          0: { cellWidth: 18, fontStyle: 'bold', halign: 'center' },
          1: { cellWidth: 28, halign: 'center' },
          2: { cellWidth: 16, fontStyle: 'bold', textColor: BLUE, halign: 'center' },
          3: { cellWidth: LCW - 18 - 28 - 16, halign: 'left' },
        },
        margin: { left: M, right: W - M - LCW },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 4

      const drawLeft = (title: string, text: string, minH = 10) => {
        doc.setFillColor(...BLUE)
        doc.setLineWidth(0)
        doc.rect(M, y, LCW, 5.5, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...WHITE)
        doc.text(title, M + 3, y + 4)
        y += 5.5
        const lines = text.trim() ? doc.splitTextToSize(text, LCW - 6) : ['—']
        const boxH = Math.max(lines.length * 4 + 4, minH)
        doc.setDrawColor(...BORDER); doc.setLineWidth(0.2)
        doc.rect(M, y, LCW, boxH)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...DARK)
        doc.text(lines, M + 3, y + 4)
        y += boxH + 3
      }

      drawLeft('DESCRIPCIÓN DEL SUELO', form.descripcion_suelo, 12)
      drawLeft('OBSERVACIONES Y/O RESTRICCIONES', form.observaciones, 12)

      const leftEndY = y

      // ── Columna derecha: esquema (desde el margen superior hasta leftEndY) ──
      const esqTotalH = leftEndY - M
      doc.setFillColor(...BLUE); doc.setLineWidth(0)
      doc.rect(RX, M, RCW, 6, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(...WHITE)
      const esqTitleLines = doc.splitTextToSize('ESQUEMA DE DISTRIBUCIÓN EN PLANTA', RCW - 4)
      doc.text(esqTitleLines, RX + RCW / 2, M + (esqTitleLines.length > 1 ? 2 : 3.5), { align: 'center' })

      const esqImgY = M + 6
      const esqImgH = esqTotalH - 6

      if (imgEsq) {
        try {
          doc.setDrawColor(...BORDER); doc.setLineWidth(0.2)
          doc.rect(RX, esqImgY, RCW, esqImgH)
          const dims = await getImageDimensions(imgEsq)
          const aspect = dims.w / dims.h
          let imgW = RCW
          let imgH = imgW / aspect
          if (imgH > esqImgH) { imgH = esqImgH; imgW = imgH * aspect }
          doc.addImage(imgEsq, RX + (RCW - imgW) / 2, esqImgY + (esqImgH - imgH) / 2, imgW, imgH)
        } catch { /**/ }
      } else {
        doc.setDrawColor(...BLUE); doc.setLineWidth(0.6)
        doc.rect(RX, esqImgY, RCW, esqImgH)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...BLUE)
        const phLines = doc.splitTextToSize('ESQUEMA DE DISTRIBUCIÓN EN PLANTA', RCW - 10)
        doc.text(phLines, RX + RCW / 2, esqImgY + esqImgH / 2, { align: 'center', baseline: 'middle' })
      }

      // ── Leyenda (alineada a la derecha) ──
      y = leftEndY + 3
      const LEYENDA_W = 80
      autoTable(doc, {
        startY: y,
        body: [
          ['Anclajes inyectados N°:', String(form.anclajes_inyectados || '0')],
          ['Anclajes acumulados N°:', String(form.anclajes_acumulados || '0')],
        ],
        styles: { fontSize: 7.5, cellPadding: { top: 1.6, bottom: 1.6, left: 3, right: 3 }, textColor: DARK, lineColor: BORDER, lineWidth: 0.2 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: LEYENDA_W - 18 },
          1: { fontStyle: 'bold', textColor: BLUE, halign: 'center', cellWidth: 18 },
        },
        margin: { left: M + CW - LEYENDA_W, right: M },
        showHead: 'never',
        theme: 'grid',
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 4

      // ── Equipo de inyección + Resumen técnico ──
      const EQ_W  = CW * 0.55
      const RES_W = CW - EQ_W

      doc.setFillColor(...BLUE); doc.setLineWidth(0)
      doc.rect(M, y, EQ_W, 5.5, 'F')
      doc.rect(M + EQ_W, y, RES_W, 5.5, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...WHITE)
      doc.text('EQUIPO DE INYECCIÓN', M + 3, y + 4)
      doc.text('RESUMEN TÉCNICO', M + EQ_W + 3, y + 4)
      y += 5.5

      const eqStartY = y

      autoTable(doc, {
        startY: eqStartY,
        body: [
          ['Central de Inyección:', form.central_inyeccion || '—'],
          ['Supervisor:',           form.supervisor         || '—'],
          ['Oper. Perforista:',     form.oper_perforista    || '—'],
          ['Oper. Inyección:',      form.oper_inyeccion     || '—'],
        ],
        styles: { fontSize: 7, cellPadding: 1.6, textColor: DARK, lineColor: BORDER, lineWidth: 0.2 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: 38 },
          1: { cellWidth: EQ_W - 38 },
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
          ['N° anclajes inyectados al 100%:', `${filas.length} und`],
          ['Consumo de cementos total:',      `${totalBls.toFixed(2)} Bls`],
        ],
        styles: { fontSize: 7, cellPadding: 1.6, textColor: DARK, lineColor: BORDER, lineWidth: 0.2 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: RES_W - 24 },
          1: { cellWidth: 24, fontStyle: 'bold', textColor: BLUE, halign: 'right' },
        },
        margin: { left: M + EQ_W, right: M },
        showHead: 'never',
        theme: 'grid',
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resEndY = (doc as any).lastAutoTable.finalY
      y = Math.max(eqEndY, resEndY) + 4

      // ── Firmas (2 columnas) ──
      const FW = CW / 2
      const FH = 22

      const firmas = [
        { empresa: 'SOIL ROCK S.A.C.',   nombre: form.supervisor_sr,              titulo: 'Supervisor Soil Rock'   },
        { empresa: clienteNombre || '—', nombre: form.supervisor_cliente_nombre,   titulo: 'Supervisor del Cliente' },
      ]

      firmas.forEach((firma, i) => {
        const fx = M + i * FW
        doc.setFillColor(...BLUE); doc.setLineWidth(0)
        doc.rect(fx, y, FW, 5.5, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(...WHITE)
        const empLines = doc.splitTextToSize(firma.empresa, FW - 4)
        doc.text(empLines, fx + FW / 2, y + (empLines.length > 1 ? 1.8 : 3.8), { align: 'center' })

        doc.setDrawColor(...BORDER); doc.setLineWidth(0.25)
        doc.rect(fx, y + 5.5, FW, FH)

        const sigY = y + 5.5 + FH * 0.65
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

      const filename = `${form.codigo || 'reporte-inyeccion'}_V${form.version || '00'}_${form.fecha || 'fecha'}.pdf`
      doc.save(filename)
    } catch (e) {
      console.error('[PDF Inyección]', e)
      setError('Error al generar PDF')
    } finally {
      setGenPdf(false)
    }
  }

  function setFila(id: string, field: keyof InyeccionFila, value: string) {
    setFilas(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  const resumen = useMemo(() => ({
    num: filas.length,
    totalBls: filas.reduce((s, a) => s + (parseFloat(a.total) || 0), 0).toFixed(2),
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
            Reportes de Inyección para Anclajes
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
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{r.anclajes?.length ?? 0}</td>
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
            {editingId ? `Editar — ${form.codigo}` : 'Nuevo reporte de inyección'}
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
          <Field label="Código del reporte">
            <input style={inp} value={form.codigo} placeholder="SR26.058-INY-001"
              onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} />
          </Field>
          <Field label="Versión">
            <input style={inp} value={form.version} placeholder="001"
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
            <input style={inp} value={form.metodologia}
              onChange={e => setForm(p => ({ ...p, metodologia: e.target.value }))} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label="Fluido">
            <input style={inp} value={form.fluido} placeholder="Agua - Cemento a/c: 0.50"
              onChange={e => setForm(p => ({ ...p, fluido: e.target.value }))} />
          </Field>
          <Field label="Cemento">
            <input style={inp} value={form.cemento} placeholder="Portland Tipo HS"
              onChange={e => setForm(p => ({ ...p, cemento: e.target.value }))} />
          </Field>
          <Field label="Aditivo">
            <input style={inp} value={form.aditivo} placeholder="N.A."
              onChange={e => setForm(p => ({ ...p, aditivo: e.target.value }))} />
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
            hint="Aparece a la derecha de la tabla en el PDF"
          />
        </div>
      </div>

      {/* Tabla de anclajes */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ ...secTitle, margin: 0 }}>Tabla de anclajes</p>
          <button
            onClick={() => setFilas(p => [...p, newInyeccionRow()])}
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ backgroundColor: '#1a3a6e' }}>
                {['Código Anclaje', 'Consumo Cemento por Manguera en Boca (Bls)', 'Total (Bls)', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '7px 8px', textAlign: 'left', color: '#fff', fontWeight: 500, fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((a, i) => {
                const bg = i % 2 === 0 ? '#fff' : '#f9fafb'
                const ci: React.CSSProperties = {
                  width: '100%', padding: '4px 5px', fontSize: 11,
                  border: '0.5px solid #e8eaed', borderRadius: 4,
                  outline: 'none', backgroundColor: '#fff', color: '#1a1d1e',
                  boxSizing: 'border-box',
                }
                const td: React.CSSProperties = { padding: '3px', backgroundColor: bg, borderBottom: '0.5px solid #f4f6f8' }
                return (
                  <tr key={a.id}>
                    <td style={td}><input style={{ ...ci, width: 80 }} value={a.codigo} placeholder="A1.08" onChange={e => setFila(a.id, 'codigo', e.target.value)} /></td>
                    <td style={td}><input type="number" style={{ ...ci, width: 80 }} value={a.consumo_boca} placeholder="0.00" onChange={e => setFila(a.id, 'consumo_boca', e.target.value)} /></td>
                    <td style={td}><input type="number" style={{ ...ci, width: 80 }} value={a.total} placeholder="0.00" onChange={e => setFila(a.id, 'total', e.target.value)} /></td>
                    <td style={{ ...td, width: '100%' }}>
                      <input style={{ ...ci }} value={a.estado}
                        placeholder="Anclaje inyectado al 100%. Se evidencia salida de lechada por la boca de la perforación."
                        onChange={e => setFila(a.id, 'estado', e.target.value)} />
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      <button onClick={() => setFilas(p => p.filter(r => r.id !== a.id))}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <IconTrash size={13} />
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
          <Field label="Anclajes inyectados">
            <input type="number" style={inp} value={form.anclajes_inyectados}
              onChange={e => setForm(p => ({ ...p, anclajes_inyectados: e.target.value }))} />
          </Field>
          <Field label="Anclajes acumulados">
            <input type="number" style={inp} value={form.anclajes_acumulados}
              onChange={e => setForm(p => ({ ...p, anclajes_acumulados: e.target.value }))} />
          </Field>
        </div>
      </div>

      {/* Equipo de inyección */}
      <div style={card}>
        <p style={secTitle}>Equipo de inyección</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([
            ['central_inyeccion', 'Central de Inyección'],
            ['supervisor',        'Supervisor'],
            ['oper_perforista',   'Oper. Perforista'],
            ['oper_inyeccion',    'Oper. Inyección'],
          ] as [keyof InyeccionFormState, string][]).map(([field, label]) => (
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <KPI label="N° anclajes inyectados al 100%" value={String(resumen.num)} />
          <KPI label="Consumo de cementos total" value={`${resumen.totalBls} Bls`} />
        </div>
      </div>

      {/* Firmas */}
      <div style={card}>
        <p style={secTitle}>Firmas del reporte</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Field label="Firma Supervisor Soil Rock (nombre)">
              <input style={inp} value={form.supervisor_sr} placeholder="Nombre completo"
                onChange={e => setForm(p => ({ ...p, supervisor_sr: e.target.value }))} />
            </Field>
            <div style={{ marginTop: 10, borderTop: '1.5px solid #9ca3af', paddingTop: 6, fontSize: 11, color: '#6b7280' }}>
              Supervisor Soil Rock
            </div>
          </div>
          <div>
            <Field label="Firma Supervisor Cliente (nombre)">
              <input style={inp} value={form.supervisor_cliente_nombre} placeholder="Nombre completo"
                onChange={e => setForm(p => ({ ...p, supervisor_cliente_nombre: e.target.value }))} />
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
