// Generador de PDF: Protocolo de Instalación de Malla en Talud (SGI-CAL-FOR-041)
// Archivo independiente — no modifica ningún otro generador.

export interface MallaPDFData {
  codigoDoc: string
  version: string
  fechaDoc: string
  nombreProyecto: string
  especialista: string
  contratista: string
  entidad: string
  ubicacion: string
  estructura: string
  fecha: string
  nRegistro: string
  planoReferencial: string
  nivelCorona: string
  nivelPieTalud: string
  nColumnasMalla: string
  malla: {
    tipo: string; marca: string; abertura: string
    diametroAlambre: string; tipoUnion: string; norma: string
  }
  alambreCoser: { material: string; diametro: string; tensionRotura: string }
  grapas: { material: string; diametro: string; tuercas: string }
  instalacion: {
    fechaInstalacion: string
    anchoRollo: string; alturaRolloFab: string
    longitudProtegidaInicial: string; alturaProtegerInicial: string
    longitudProtegidaFinal: string; alturaProtegerFinal: string
    areaProtegida: string; usoGrapas: string
  }
  imagenes: {
    logoSR: string | null
    logoCliente: string | null
    registroFotografico1: string | null
    registroFotografico2: string | null
    elevacionTalud: string | null
  }
  firmas: {
    representanteSR: string
    representanteContratista: string
  }
}

async function getImageDimensions(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve({ w: 1, h: 1 })
    img.src = src
  })
}

async function fitImage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  src: string,
  x: number, y: number, maxW: number, maxH: number
): Promise<void> {
  try {
    const dims = await getImageDimensions(src)
    const aspect = dims.w / dims.h
    let iw = maxW
    let ih = iw / aspect
    if (ih > maxH) { ih = maxH; iw = ih * aspect }
    doc.addImage(src, x + (maxW - iw) / 2, y + (maxH - ih) / 2, iw, ih)
  } catch { /**/ }
}

export async function generateMallasPDF(data: MallaPDFData): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297, H = 210, M = 8, BOTTOM_M = 10, CW = W - M * 2

  const BLUE   = [26, 58, 110]   as [number, number, number]
  const LBLUE  = [232, 238, 246] as [number, number, number]
  const GRAY   = [107, 114, 128] as [number, number, number]
  const DARK   = [26, 29, 30]    as [number, number, number]
  const WHITE  = [255, 255, 255] as [number, number, number]
  const BORDER = [210, 215, 220] as [number, number, number]

  const { imagenes, firmas } = data

  let currentY = M

  // ── helpers ────────────────────────────────────────────────────────────────

  const checkPage = (needed: number) => {
    if (currentY + needed > H - BOTTOM_M) {
      doc.addPage()
      currentY = M
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastY = () => (doc as any).lastAutoTable.finalY

  // ── 1. HEADER ──────────────────────────────────────────────────────────────
  const LOGO_W = 34
  const TITLE_W = CW - LOGO_W * 2
  const HDR_H = 24

  doc.setFillColor(...BLUE)
  doc.rect(M, currentY, CW, HDR_H, 'F')
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.3)
  doc.rect(M, currentY, CW, HDR_H)
  doc.line(M + LOGO_W, currentY, M + LOGO_W, currentY + HDR_H)
  doc.line(M + LOGO_W + TITLE_W, currentY, M + LOGO_W + TITLE_W, currentY + HDR_H)

  // Logo SR
  if (imagenes.logoSR) {
    await fitImage(doc, imagenes.logoSR, M + 2, currentY + 2, LOGO_W - 4, HDR_H - 4)
  } else {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...WHITE)
    doc.text('SOIL ROCK', M + LOGO_W / 2, currentY + HDR_H / 2, { align: 'center', baseline: 'middle' })
  }

  // Logo cliente
  if (imagenes.logoCliente) {
    await fitImage(doc, imagenes.logoCliente, M + LOGO_W + TITLE_W + 2, currentY + 2, LOGO_W - 4, HDR_H - 4)
  }

  // Título central
  const tCX = M + LOGO_W + TITLE_W / 2
  const tW  = TITLE_W - 4

  doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(200, 210, 230)
  doc.text('PROTOCOLO DE CALIDAD', tCX, currentY + 5, { align: 'center' })

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...WHITE)
  const titleLines = doc.splitTextToSize('PROTOCOLO DE INSTALACION DE MALLA EN TALUD', tW)
  const lineH = 4.5
  let ty = currentY + 10
  doc.text(titleLines, tCX, ty, { align: 'center' })
  ty += titleLines.length * lineH + 1

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...WHITE)
  doc.text(data.codigoDoc || '—', tCX, ty, { align: 'center' })
  ty += 5

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(200, 210, 230)
  doc.text(`Version ${data.version || '—'} / ${data.fechaDoc || '—'}`, tCX, ty, { align: 'center' })

  currentY += HDR_H + 2

  // ── 2. DATOS GENERALES ──────────────────────────────────────────────────────
  checkPage(38)

  doc.setFillColor(...BLUE); doc.setLineWidth(0)
  doc.rect(M, currentY, CW, 5.5, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...WHITE)
  doc.text('DATOS GENERALES', M + 3, currentY + 4)
  currentY += 5.5

  const half = CW / 2
  // Cols: label-L(32) + val-L(108.5) + label-R(38) + val-R(102.5) = 281
  autoTable(doc, {
    startY: currentY,
    body: [
      ['Nombre del Proyecto:', data.nombreProyecto || '—', 'Fecha:',                 data.fecha || '—'],
      ['Especialista:',        data.especialista || '—',   'N° Registro:',            data.nRegistro || '—'],
      ['Contratista:',         data.contratista || '—',    'Plano Referencial:',       data.planoReferencial || '—'],
      ['Entidad:',             data.entidad || '—',        'Nivel de Corona:',         data.nivelCorona || '—'],
      ['Ubicacion:',           data.ubicacion || '—',      'Nivel de Pie Talud:',      data.nivelPieTalud || '—'],
      ['Estructura:',          data.estructura || '—',     'N° Columnas de Malla:',    data.nColumnasMalla || '—'],
    ],
    styles: {
      fontSize: 7, cellPadding: { top: 1.4, bottom: 1.4, left: 2.5, right: 2 },
      textColor: DARK, lineColor: BORDER, lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: 32 },
      1: { cellWidth: half - 32 },
      2: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: 38 },
      3: { cellWidth: half - 38 },
    },
    margin: { left: M, right: M },
    showHead: 'never',
    theme: 'grid',
  })
  currentY = lastY() + 3

  // ── 3. CARACTERÍSTICAS DE MALLA ─────────────────────────────────────────────
  // Malla(label 34 + val 60) + Alambre Coser(label 36 + val 56) + Grapas(label 28 + val 67) = 281
  checkPage(42)

  doc.setFillColor(...BLUE); doc.setLineWidth(0)
  doc.rect(M, currentY, CW, 5.5, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...WHITE)
  doc.text('CARACTERISTICAS DE MALLA', M + 3, currentY + 4)
  currentY += 5.5

  autoTable(doc, {
    startY: currentY,
    head: [[
      { content: 'MALLA',            colSpan: 2, styles: { halign: 'center', fillColor: [45, 85, 150] as [number,number,number], textColor: WHITE, fontStyle: 'bold', fontSize: 7 } },
      { content: 'ALAMBRE DE COSER', colSpan: 2, styles: { halign: 'center', fillColor: [45, 85, 150] as [number,number,number], textColor: WHITE, fontStyle: 'bold', fontSize: 7 } },
      { content: 'GRAPAS',           colSpan: 2, styles: { halign: 'center', fillColor: [45, 85, 150] as [number,number,number], textColor: WHITE, fontStyle: 'bold', fontSize: 7 } },
    ]],
    body: [
      ['Tipo',              data.malla.tipo || '—',              'Material',          data.alambreCoser.material || '—',     'Material', data.grapas.material || '—'],
      ['Marca',             data.malla.marca || '—',             'Diametro',          data.alambreCoser.diametro || '—',     'Diametro', data.grapas.diametro || '—'],
      ['Abertura',          data.malla.abertura || '—',          'Tension de Rotura', data.alambreCoser.tensionRotura || '—','Tuercas',  data.grapas.tuercas || '—'],
      ['Diametro Alambre',  data.malla.diametroAlambre || '—',   '', '', '', ''],
      ['Tipo de Union',     data.malla.tipoUnion || '—',         '', '', '', ''],
      ['Norma',             data.malla.norma || '—',             '', '', '', ''],
    ],
    styles: {
      fontSize: 6.5, cellPadding: { top: 1.3, bottom: 1.3, left: 2.5, right: 2 },
      textColor: DARK, lineColor: BORDER, lineWidth: 0.2,
    },
    headStyles: { lineColor: [10, 30, 70] as [number,number,number], lineWidth: 0.2 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: 34 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: 36 },
      3: { cellWidth: 56 },
      4: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: 28 },
      5: { cellWidth: 67 },
    },
    margin: { left: M, right: M },
    theme: 'grid',
  })
  currentY = lastY() + 3

  // ── 4. INSTALACIÓN + REGISTRO FOTOGRÁFICO ─────────────────────────────────
  checkPage(50)

  const INS_W  = Math.round(CW * 0.54)   // ~152mm
  const GAP    = 3
  const FOTO_W = CW - INS_W - GAP         // ~126mm
  const FOTO_X = M + INS_W + GAP

  // Dos títulos al mismo nivel
  doc.setFillColor(...BLUE); doc.setLineWidth(0)
  doc.rect(M,      currentY, INS_W,  5.5, 'F')
  doc.rect(FOTO_X, currentY, FOTO_W, 5.5, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...WHITE)
  doc.text('INSTALACION',           M + 3,      currentY + 4)
  doc.text('REGISTRO FOTOGRAFICO',  FOTO_X + 3, currentY + 4)
  currentY += 5.5

  const insStartY = currentY
  const { instalacion } = data
  const lblW = INS_W * 0.60

  autoTable(doc, {
    startY: insStartY,
    body: [
      ['Fecha de Instalacion:',            instalacion.fechaInstalacion || '—'],
      ['Ancho de Rollo (m.)',              instalacion.anchoRollo || '—'],
      ['Altura de Rollo Fab. (m.)',        instalacion.alturaRolloFab || '—'],
      ['Longitud Protegida Inicial (m.)',  instalacion.longitudProtegidaInicial || '—'],
      ['Altura a Proteger Inicial (m.)',   instalacion.alturaProtegerInicial || '—'],
      ['Longitud Protegida Final (m.)',    instalacion.longitudProtegidaFinal || '—'],
      ['Altura a Proteger Final (m.)',     instalacion.alturaProtegerFinal || '—'],
      ['Area Protegida (m2) *',           instalacion.areaProtegida || '—'],
      ['Uso de Grapas (und.)',             instalacion.usoGrapas || '—'],
    ],
    styles: {
      fontSize: 7, cellPadding: { top: 1.4, bottom: 1.4, left: 2.5, right: 2 },
      textColor: DARK, lineColor: BORDER, lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: LBLUE, textColor: [26, 58, 110], cellWidth: lblW },
      1: { cellWidth: INS_W - lblW },
    },
    margin: { left: M, right: W - M - INS_W },
    showHead: 'never',
    theme: 'grid',
  })

  const insEndY = lastY()

  // Nota debajo de la tabla de instalación
  doc.setFont('helvetica', 'italic'); doc.setFontSize(5.5); doc.setTextColor(...GRAY)
  doc.text('* El area indicada corresponde a un valor teorico estimado', M, insEndY + 3)

  // Registro fotográfico (columna derecha, misma altura que la tabla)
  const fotoH = insEndY - insStartY
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.2)
  doc.rect(FOTO_X, insStartY, FOTO_W, fotoH)

  const { registroFotografico1: foto1, registroFotografico2: foto2 } = imagenes

  if (foto1 && foto2 && fotoH > 0) {
    // Dos fotos: lado a lado con divisor central
    const half = (FOTO_W - 1) / 2
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.2)
    doc.line(FOTO_X + half, insStartY, FOTO_X + half, insStartY + fotoH)
    await fitImage(doc, foto1, FOTO_X + 1,          insStartY + 1, half - 2,  fotoH - 2)
    await fitImage(doc, foto2, FOTO_X + half + 1,   insStartY + 1, half - 2,  fotoH - 2)
  } else if ((foto1 || foto2) && fotoH > 0) {
    // Una sola foto: centrada en todo el espacio
    await fitImage(doc, (foto1 ?? foto2)!, FOTO_X + 1, insStartY + 1, FOTO_W - 2, fotoH - 2)
  } else {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GRAY)
    doc.text('Registro Fotografico', FOTO_X + FOTO_W / 2, insStartY + fotoH / 2, { align: 'center', baseline: 'middle' })
  }

  currentY = Math.max(insEndY + 6, insStartY + fotoH + 3)

  // ── 5. ELEVACIÓN DE SUPERFICIE DE TALUD ────────────────────────────────────
  const ELE_H = 38
  checkPage(5.5 + ELE_H + 3 + 5.5 + 22 + 4)  // elevación + gap + firmas

  doc.setFillColor(...BLUE); doc.setLineWidth(0)
  doc.rect(M, currentY, CW, 5.5, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...WHITE)
  doc.text('ELEVACION DE SUPERFICIE DE TALUD', M + 3, currentY + 4)
  currentY += 5.5

  const eleY = currentY
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.2)
  doc.rect(M, eleY, CW, ELE_H)

  if (imagenes.elevacionTalud) {
    await fitImage(doc, imagenes.elevacionTalud, M + 1, eleY + 1, CW - 2, ELE_H - 6)
  }

  // Etiqueta PIE DEL TALUD
  doc.setFillColor(232, 238, 246); doc.setLineWidth(0)
  doc.rect(M, eleY + ELE_H - 5.5, CW, 5.5, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...BLUE)
  doc.text('PIE DEL TALUD', M + CW / 2, eleY + ELE_H - 5.5 + 3.8, { align: 'center' })

  currentY = eleY + ELE_H + 3

  // ── 6. FIRMAS ─────────────────────────────────────────────────────────────
  const FW = CW / 2
  const FH = 22
  checkPage(5.5 + FH + 4)

  const firmaDefs = [
    { title: 'REPRESENTANTE DE SOIL ROCK S.A.C.',  nombre: firmas.representanteSR,           sub: 'Sello y Firma' },
    { title: 'REPRESENTANTE DEL CONTRATISTA',        nombre: firmas.representanteContratista, sub: 'Sello y Firma' },
  ]

  firmaDefs.forEach((f, i) => {
    const fx = M + i * FW
    doc.setFillColor(...BLUE); doc.setLineWidth(0)
    doc.rect(fx, currentY, FW, 5.5, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(...WHITE)
    const empLines = doc.splitTextToSize(f.title, FW - 4)
    doc.text(empLines, fx + FW / 2, currentY + (empLines.length > 1 ? 1.8 : 3.8), { align: 'center' })

    doc.setDrawColor(...BORDER); doc.setLineWidth(0.25)
    doc.rect(fx, currentY + 5.5, FW, FH)

    const sigY = currentY + 5.5 + FH * 0.65
    if (f.nombre) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...DARK)
      const nLines = doc.splitTextToSize(f.nombre, FW - 8)
      doc.text(nLines, fx + FW / 2, sigY - (nLines.length > 1 ? nLines.length * 3.2 : 3.5), { align: 'center' })
    }

    doc.setDrawColor(160, 170, 185); doc.setLineWidth(0.5)
    doc.line(fx + 5, sigY, fx + FW - 5, sigY)

    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...GRAY)
    doc.text(f.sub, fx + FW / 2, sigY + 4.5, { align: 'center' })
  })

  const filename = `${data.codigoDoc || 'protocolo-malla'}_V${data.version || '00'}_${data.fechaDoc.replace(/\./g, '-') || 'fecha'}.pdf`
  doc.save(filename)
}
