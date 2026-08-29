import React from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/session'
import {
  IconBriefcase2,
  IconFolderOpen,
  IconUsers,
  IconCurrencyDollar,
  IconCircleDot,
} from '@tabler/icons-react'
import ActividadTable, { type ActividadItem } from './ActividadTable'

// ─── Mapas de etiquetas / colores ──────────────────────────────────────────

const FASE_LABEL: Record<string, string> = {
  pre_proyecto: 'Contacto',
  propuesta:    'Propuesta',
  negociacion:  'Negociación',
  adjudicado:   'Adjudicado',
  en_pausa:     'En pausa',
  ejecucion:    'Ejecución',
  cierre:       'Cierre',
  cerrado:      'Cerrado',
  cancelado:    'Cancelado',
}

const FASE_BADGE: Record<string, { bg: string; color: string }> = {
  pre_proyecto: { bg: '#f3f4f6', color: '#6b7280' },
  propuesta:    { bg: '#fef3c7', color: '#92400e' },
  negociacion:  { bg: '#fef3c7', color: '#92400e' },
  adjudicado:   { bg: '#dcfce7', color: '#166534' },
  en_pausa:     { bg: '#f3f4f6', color: '#6b7280' },
  ejecucion:    { bg: '#dbeafe', color: '#1e40af' },
  cierre:       { bg: '#f3f4f6', color: '#6b7280' },
  cerrado:      { bg: '#f3f4f6', color: '#6b7280' },
  cancelado:    { bg: '#fee2e2', color: '#991b1b' },
}

// dot color por fase de pipeline
const FASE_DOT: Record<string, string> = {
  pre_proyecto: '#94a3b8',
  propuesta:    '#f59e0b',
  negociacion:  '#f97316',
  adjudicado:   '#22c55e',
  en_pausa:     '#cbd5e1',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMonto(n: number, moneda = 'PEN') {
  const s = moneda === 'USD' ? 'US$' : 'S/'
  if (n >= 1_000_000) return `${s} ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${s} ${(n / 1_000).toFixed(0)}K`
  return `${s} ${n.toLocaleString('es-PE')}`
}

function formatMontoAdjudicados(pen: number, usd: number) {
  const parts: string[] = []
  if (pen > 0) parts.push(formatMonto(pen, 'PEN'))
  if (usd > 0) parts.push(formatMonto(usd, 'USD'))
  return parts.length > 0 ? parts.join(' + ') : 'S/ 0'
}

function formatFecha(date: Date) {
  return date.toLocaleString('es-PE', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Estilos de tabla ────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  padding: '8px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: '#6b7280',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
  background: '#fafafa',
}

const TD: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: 13,
  color: '#374151',
  verticalAlign: 'middle',
  borderBottom: '1px solid #f3f4f6',
}

const TD_TOTAL: React.CSSProperties = {
  ...TD,
  fontSize: 12,
  fontWeight: 600,
  color: '#111827',
  backgroundColor: '#fafafa',
  borderBottom: 'none',
}

// ─── Estilos de cards de sección ────────────────────────────────────────────

const SECTION_CARD: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  overflow: 'hidden',
}

const SECTION_HEADER: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 18px',
  borderBottom: '1px solid #f3f4f6',
}

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#111827',
  letterSpacing: '-0.01em',
}

const SECTION_LINK: React.CSSProperties = {
  fontSize: 12,
  color: '#004aad',
  textDecoration: 'none',
  fontWeight: 500,
  letterSpacing: '-0.01em',
}

export const dynamic = 'force-dynamic'

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const session = token ? await verifyToken(token) : null
  const verMontos    = session?.rol === 'gerente' || session?.permisos?.ver_montos    === true
  const verComercial = session?.rol === 'gerente' || session?.permisos?.ver_comercial === true

  const PIPELINE_FASES = ['pre_proyecto', 'propuesta', 'negociacion', 'adjudicado', 'en_pausa'] as const
  const OP_FASES       = ['adjudicado', 'ejecucion', 'cierre'] as const

  const [
    pipelinePorFase,
    proyectosActivos,
    actividadesRecientes,
    totalClientes,
    totalDocumentos,
    adjudicadosMonto,
  ] = await Promise.all([
    prisma.proyecto.groupBy({
      by: ['fase'],
      where: { fase: { in: [...PIPELINE_FASES] } },
      _count: { id: true },
      _sum:   { monto_contrato: true },
    }),
    prisma.proyecto.findMany({
      where: { fase: { in: [...OP_FASES] } },
      select: {
        id: true, codigo: true, nombre: true, fase: true,
        avance_general: true, monto_contrato: true,
        cliente: { select: { razon_social: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 10,
    }),
    prisma.actividad.findMany({
      include: {
        usuario: { select: { nombre: true } },
        proyecto: { select: { nombre: true, codigo: true, id: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    }),
    prisma.cliente.count(),
    prisma.documento.count(),
    prisma.proyecto.findMany({
      where: {
        OR: [
          { fase: { in: ['adjudicado', 'ejecucion', 'cierre', 'cerrado'] } },
          { fase: 'cancelado', monto_contrato: { gt: 0 } },
        ],
      },
      select: { monto_contrato: true, moneda: true },
    }),
  ])

  // Aggregations
  const totalOportunidades = pipelinePorFase
    .filter(f => f.fase !== 'en_pausa')
    .reduce((acc, f) => acc + f._count.id, 0)

  const valorPipeline = pipelinePorFase.reduce(
    (acc, f) => acc + Number(f._sum.monto_contrato ?? 0), 0
  )

  const enEjecucion = proyectosActivos.filter(p => p.fase === 'ejecucion').length

  const adjPEN = adjudicadosMonto.filter(p => p.moneda === 'PEN').reduce((acc, p) => acc + Number(p.monto_contrato), 0)
  const adjUSD = adjudicadosMonto.filter(p => p.moneda === 'USD').reduce((acc, p) => acc + Number(p.monto_contrato), 0)
  const adjCount = adjudicadosMonto.length

  const PIPELINE_ORDER = ['pre_proyecto', 'propuesta', 'negociacion', 'en_pausa']
  const pipelineMap = Object.fromEntries(
    pipelinePorFase.map(f => [f.fase, { count: f._count.id, monto: Number(f._sum.monto_contrato ?? 0) }])
  )
  const pipelineTotalCount = pipelinePorFase.reduce((acc, f) => acc + f._count.id, 0)
  const pipelineTotalMonto = pipelinePorFase.reduce((acc, f) => acc + Number(f._sum.monto_contrato ?? 0), 0)

  const actividadesSerializadas: ActividadItem[] = actividadesRecientes.map(a => ({
    id: a.id,
    tipo: a.tipo,
    descripcion: a.descripcion,
    createdAt: a.created_at.toISOString(),
    proyecto: { id: a.proyecto.id, nombre: a.proyecto.nombre, codigo: a.proyecto.codigo },
    usuario:  { nombre: a.usuario.nombre },
  }))

  // KPI cards
  const KPI_CARDS = [
    {
      label: 'Oportunidades activas',
      value: String(totalOportunidades),
      sub: 'En pipeline comercial',
      icon: <IconBriefcase2 size={17} strokeWidth={1.5} />,
      href: '/dashboard/pipeline',
      accent: '#1e40af',
      bg: '#eff6ff',
      show: verComercial,
    },
    {
      label: 'Proyectos en ejecución',
      value: String(enEjecucion),
      sub: `${proyectosActivos.length} operativos en total`,
      icon: <IconFolderOpen size={17} strokeWidth={1.5} />,
      href: '/dashboard/proyectos',
      accent: '#0369a1',
      bg: '#f0f9ff',
      show: true,
    },
    {
      label: 'Valor del pipeline',
      value: verMontos ? formatMonto(valorPipeline) : '—',
      sub: 'Estimado total',
      icon: <IconCurrencyDollar size={17} strokeWidth={1.5} />,
      href: '/dashboard/pipeline',
      accent: '#15803d',
      bg: '#f0fdf4',
      show: verComercial,
    },
    {
      label: 'Clientes',
      value: String(totalClientes),
      sub: verMontos ? `${totalDocumentos} documentos` : 'Registrados',
      icon: <IconUsers size={17} strokeWidth={1.5} />,
      href: '/dashboard/clientes',
      accent: '#c2410c',
      bg: '#fff7ed',
      show: verComercial,
    },
    {
      label: 'Monto adjudicado',
      value: verMontos ? formatMontoAdjudicados(adjPEN, adjUSD) : '—',
      sub: `${adjCount} proyecto${adjCount !== 1 ? 's' : ''} adjudicado${adjCount !== 1 ? 's' : ''}`,
      icon: <IconCircleDot size={17} strokeWidth={1.5} />,
      href: '/dashboard/pipeline',
      accent: '#15803d',
      bg: '#f0fdf4',
      show: verComercial && verMontos,
    },
  ].filter(c => c.show)

  const avanceProm = proyectosActivos.length > 0
    ? Math.round(proyectosActivos.reduce((a, p) => a + Number(p.avance_general), 0) / proyectosActivos.length)
    : null

  const now = new Date()

  return (
    <div style={{ padding: '32px', maxWidth: 1280, minWidth: 0 }}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 22,
          fontWeight: 600,
          color: '#111827',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          marginBottom: 4,
        }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 400, marginBottom: 4 }}>
          Vista ejecutiva — Soil Rock
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af' }}>
          Última actualización: {formatFecha(now)}
        </p>
      </div>

      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${KPI_CARDS.length}, 1fr)`,
        gap: 16,
        marginBottom: 24,
      }}>
        {KPI_CARDS.map(({ label, value, sub, icon, href, accent, bg }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: '20px',
              cursor: 'pointer',
              position: 'relative',
              minHeight: 120,
            }}>
              {/* Ícono arriba a la derecha */}
              <div style={{
                position: 'absolute',
                top: 20,
                right: 20,
                color: accent,
                opacity: 0.5,
              }}>
                {icon}
              </div>

              {/* Valor grande */}
              <div style={{ marginBottom: 6 }}>
                {value.includes(' + ') ? (
                  <>
                    <div style={{ fontSize: 32, fontWeight: 600, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                      {value.split(' + ')[0]}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#6b7280', marginTop: 2 }}>
                      + {value.split(' + ')[1]}
                    </div>
                  </>
                ) : (value.startsWith('S/') || value.startsWith('US$')) ? (
                  <div style={{ fontSize: 32, fontWeight: 600, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    {value}
                  </div>
                ) : (
                  <div style={{ fontSize: 32, fontWeight: 600, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    {value}
                  </div>
                )}
              </div>

              {/* Label */}
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e', marginBottom: 4 }}>
                {label}
              </div>

              {/* Sub */}
              <div style={{ fontSize: 11, color: '#9ba3af' }}>
                {sub}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Pipeline + Proyectos ──────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: verComercial ? '1fr 1fr' : '1fr',
        gap: 16,
        marginBottom: 16,
      }}>

        {/* Pipeline comercial */}
        {verComercial && (
          <div style={SECTION_CARD}>
            <div style={SECTION_HEADER}>
              <span style={SECTION_TITLE}>Pipeline comercial</span>
              <Link href="/dashboard/pipeline" style={SECTION_LINK}>
                Ver pipeline completo →
              </Link>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH}>Etapa</th>
                  <th style={{ ...TH, textAlign: 'center', width: 100 }}>Oportunidades</th>
                  {verMontos && <th style={{ ...TH, textAlign: 'right', width: 120 }}>Valor estimado</th>}
                </tr>
              </thead>
              <tbody>
                {PIPELINE_ORDER.map(fase => {
                  const data  = pipelineMap[fase]
                  const count = data?.count ?? 0
                  const monto = data?.monto ?? 0
                  const dot   = FASE_DOT[fase] ?? '#9ca3af'
                  return (
                    <tr key={fase}>
                      <td style={TD}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: dot,
                            flexShrink: 0,
                            display: 'inline-block',
                          }} />
                          <span style={{ color: '#374151', letterSpacing: '-0.01em' }}>
                            {FASE_LABEL[fase]}
                          </span>
                        </div>
                      </td>
                      <td style={{ ...TD, textAlign: 'center', fontWeight: count > 0 ? 500 : 400, color: count > 0 ? '#111827' : '#9ca3af' }}>
                        {count}
                      </td>
                      {verMontos && (
                        <td style={{ ...TD, textAlign: 'right', color: '#6b7280' }}>
                          {monto > 0 ? formatMonto(monto) : '—'}
                        </td>
                      )}
                    </tr>
                  )
                })}
                {/* Total */}
                <tr>
                  <td style={TD_TOTAL}>Total</td>
                  <td style={{ ...TD_TOTAL, textAlign: 'center', color: '#004aad' }}>
                    {pipelineTotalCount}
                  </td>
                  {verMontos && (
                    <td style={{ ...TD_TOTAL, textAlign: 'right' }}>
                      {pipelineTotalMonto > 0 ? formatMonto(pipelineTotalMonto) : '—'}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Proyectos activos */}
        <div style={SECTION_CARD}>
          <div style={SECTION_HEADER}>
            <span style={SECTION_TITLE}>Proyectos activos</span>
            <Link href="/dashboard/proyectos" style={SECTION_LINK}>
              Ver todos →
            </Link>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...TH, width: 88 }}>Código</th>
                <th style={TH}>Proyecto</th>
                <th style={{ ...TH, width: 100 }}>Etapa</th>
                <th style={{ ...TH, textAlign: 'right', width: 110 }}>Avance</th>
              </tr>
            </thead>
            <tbody>
              {proyectosActivos.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ ...TD, textAlign: 'center', color: '#9ca3af' }}>
                    Sin proyectos operativos
                  </td>
                </tr>
              ) : (
                proyectosActivos.map(p => {
                  const avance = Number(p.avance_general)
                  const badge  = FASE_BADGE[p.fase]
                  return (
                    <tr key={p.id}>
                      <td style={{ ...TD, fontWeight: 500 }}>
                        <Link href={`/dashboard/proyectos/${p.id}`} style={{ textDecoration: 'none', color: '#004aad', fontSize: 12, letterSpacing: '-0.01em' }}>
                          {p.codigo}
                        </Link>
                      </td>
                      <td style={TD}>
                        <Link href={`/dashboard/proyectos/${p.id}`} style={{
                          textDecoration: 'none',
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                          maxWidth: 220,
                          letterSpacing: '-0.01em',
                        }}>
                          {p.nombre}
                        </Link>
                      </td>
                      <td style={TD}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 7px',
                          borderRadius: 5,
                          backgroundColor: badge.bg,
                          color: badge.color,
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.01em',
                        }}>
                          {FASE_LABEL[p.fase]}
                        </span>
                      </td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                          <div style={{ width: 56, height: 3, backgroundColor: '#e5e7eb', borderRadius: 2 }}>
                            <div style={{
                              height: 3,
                              width: `${avance}%`,
                              backgroundColor: '#004aad',
                              borderRadius: 2,
                            }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 28, letterSpacing: '-0.01em' }}>
                            {avance}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
              {/* Total */}
              <tr>
                <td colSpan={3} style={TD_TOTAL}>
                  Total proyectos ({proyectosActivos.length})
                </td>
                <td style={{ ...TD_TOTAL, textAlign: 'right', color: '#6b7280', fontWeight: 400 }}>
                  {avanceProm !== null ? `${avanceProm}% prom.` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Actividad reciente ────────────────────────────────────────────── */}
      <div style={{ ...SECTION_CARD, marginBottom: 16 }}>
        <div style={SECTION_HEADER}>
          <span style={SECTION_TITLE}>Actividad reciente</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            {actividadesSerializadas.length} registros
          </span>
        </div>
        <ActividadTable actividades={actividadesSerializadas} />
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTop: '1px solid #e5e7eb',
      }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>Soil Rock © 2026</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>Versión 1.0.0 · Ambiente: Producción</span>
      </div>
    </div>
  )
}
