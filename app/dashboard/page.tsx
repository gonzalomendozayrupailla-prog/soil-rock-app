import React from 'react'
import Link from 'next/link'
import { prisma } from '@/app/lib/prisma'
import {
  IconBriefcase2,
  IconFolderOpen,
  IconUsers,
  IconCurrencyDollar,
  IconCircleDot,
  IconFileText,
  IconPhone,
  IconMail,
  IconNotes,
  IconArrowNarrowRight,
} from '@tabler/icons-react'

const FASE_LABEL: Record<string, string> = {
  pre_proyecto: 'Contacto',
  propuesta: 'Propuesta',
  negociacion: 'Negociación',
  adjudicado: 'Adjudicado',
  en_pausa: 'En pausa',
  ejecucion: 'Ejecución',
  cierre: 'Cierre',
  cerrado: 'Cerrado',
  cancelado: 'Cancelado',
}

const FASE_BADGE: Record<string, { bg: string; color: string }> = {
  pre_proyecto: { bg: '#f4f6f8', color: '#6b7280' },
  propuesta: { bg: '#faeeda', color: '#854f0b' },
  negociacion: { bg: '#faeeda', color: '#854f0b' },
  adjudicado: { bg: '#eaf3de', color: '#3b6d11' },
  en_pausa: { bg: '#f4f6f8', color: '#6b7280' },
  ejecucion: { bg: '#e8f0fd', color: '#004aad' },
  cierre: { bg: '#f4f6f8', color: '#6b7280' },
  cerrado: { bg: '#f4f6f8', color: '#6b7280' },
  cancelado: { bg: '#fcebeb', color: '#a32d2d' },
}

const TIPO_ICON: Record<string, React.ReactNode> = {
  nota: <IconNotes size={13} strokeWidth={1.6} />,
  llamada: <IconPhone size={13} strokeWidth={1.6} />,
  reunion: <IconMail size={13} strokeWidth={1.6} />,
  documento_recibido: <IconFileText size={13} strokeWidth={1.6} />,
  documento_enviado: <IconFileText size={13} strokeWidth={1.6} />,
  cambio_fase: <IconArrowNarrowRight size={13} strokeWidth={1.6} />,
  propuesta_enviada: <IconBriefcase2 size={13} strokeWidth={1.6} />,
  observacion_cliente: <IconNotes size={13} strokeWidth={1.6} />,
}

function formatMonto(n: number) {
  if (n >= 1_000_000) return `S/ ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `S/ ${(n / 1_000).toFixed(0)}K`
  return `S/ ${n.toLocaleString('es-PE')}`
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const PIPELINE_FASES = ['pre_proyecto', 'propuesta', 'negociacion', 'adjudicado', 'en_pausa'] as const
  const OP_FASES = ['adjudicado', 'ejecucion', 'cierre'] as const

  const [
    pipelinePorFase,
    proyectosActivos,
    actividadesRecientes,
    totalClientes,
    totalDocumentos,
  ] = await Promise.all([
    // Pipeline: count + sum per fase
    prisma.proyecto.groupBy({
      by: ['fase'],
      where: { fase: { in: [...PIPELINE_FASES] } },
      _count: { id: true },
      _sum: { monto_contrato: true },
    }),
    // Proyectos operativos activos
    prisma.proyecto.findMany({
      where: { fase: { in: [...OP_FASES] } },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        fase: true,
        avance_general: true,
        monto_contrato: true,
        cliente: { select: { razon_social: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 7,
    }),
    // Actividades recientes
    prisma.actividad.findMany({
      include: {
        usuario: { select: { nombre: true } },
        proyecto: { select: { nombre: true, codigo: true, id: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 7,
    }),
    prisma.cliente.count(),
    prisma.documento.count(),
  ])

  // Aggregate pipeline stats
  const totalOportunidades = pipelinePorFase
    .filter((f) => f.fase !== 'en_pausa')
    .reduce((acc, f) => acc + f._count.id, 0)

  const valorPipeline = pipelinePorFase.reduce(
    (acc, f) => acc + Number(f._sum.monto_contrato ?? 0),
    0
  )

  const enEjecucion = proyectosActivos.filter((p) => p.fase === 'ejecucion').length

  // Pipeline order for display
  const PIPELINE_ORDER = ['pre_proyecto', 'propuesta', 'negociacion', 'adjudicado', 'en_pausa']
  const pipelineMap = Object.fromEntries(
    pipelinePorFase.map((f) => [f.fase, { count: f._count.id, monto: Number(f._sum.monto_contrato ?? 0) }])
  )
  const maxCount = Math.max(...pipelinePorFase.map((f) => f._count.id), 1)

  const statCards = [
    {
      label: 'Oportunidades activas',
      value: totalOportunidades,
      sub: 'En pipeline comercial',
      icon: <IconBriefcase2 size={18} strokeWidth={1.6} />,
      href: '/dashboard/pipeline',
      color: '#004aad',
      bg: '#e8f0fd',
    },
    {
      label: 'Proyectos en ejecución',
      value: enEjecucion,
      sub: `${proyectosActivos.length} operativos en total`,
      icon: <IconFolderOpen size={18} strokeWidth={1.6} />,
      href: '/dashboard/proyectos',
      color: '#0ca3df',
      bg: '#e0f4fc',
    },
    {
      label: 'Valor del pipeline',
      value: formatMonto(valorPipeline),
      sub: 'Estimado total',
      icon: <IconCurrencyDollar size={18} strokeWidth={1.6} />,
      href: '/dashboard/pipeline',
      color: '#3b6d11',
      bg: '#eaf3de',
    },
    {
      label: 'Clientes',
      value: totalClientes,
      sub: `${totalDocumentos} documentos`,
      icon: <IconUsers size={18} strokeWidth={1.6} />,
      href: '/dashboard/clientes',
      color: '#854f0b',
      bg: '#faeeda',
    },
  ]

  return (
    <div style={{ padding: 28, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: '#1a1d1e', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '3px 0 0' }}>
          Vista ejecutiva — Soil Rock
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 22,
        }}
      >
        {statCards.map(({ label, value, sub, icon, href, color, bg }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '0.5px solid #e8eaed',
                borderRadius: 10,
                padding: '16px 18px',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 7,
                  backgroundColor: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color,
                  marginBottom: 12,
                }}
              >
                {icon}
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#1a1d1e', marginBottom: 2 }}>
                {value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1d1e' }}>{label}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid: Pipeline + Proyectos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Pipeline por fase */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid #e8eaed',
            borderRadius: 10,
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e' }}>Pipeline comercial</span>
            <Link href="/dashboard/pipeline" style={{ fontSize: 12, color: '#004aad', textDecoration: 'none' }}>
              Ver kanban →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PIPELINE_ORDER.map((fase) => {
              const data = pipelineMap[fase]
              if (!data && fase === 'en_pausa') return null
              const count = data?.count ?? 0
              const monto = data?.monto ?? 0
              const badge = FASE_BADGE[fase]
              const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0
              return (
                <div key={fase}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 7px',
                          borderRadius: 4,
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {FASE_LABEL[fase]}
                      </span>
                      <span style={{ fontSize: 12, color: '#1a1d1e', fontWeight: 500 }}>{count}</span>
                    </div>
                    {monto > 0 && (
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatMonto(monto)}</span>
                    )}
                  </div>
                  <div style={{ height: 4, backgroundColor: '#f4f6f8', borderRadius: 2 }}>
                    <div
                      style={{
                        height: 4,
                        width: `${barPct}%`,
                        backgroundColor: fase === 'en_pausa' ? '#9ca3af' : '#004aad',
                        borderRadius: 2,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Proyectos activos */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid #e8eaed',
            borderRadius: 10,
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e' }}>Proyectos activos</span>
            <Link href="/dashboard/proyectos" style={{ fontSize: 12, color: '#004aad', textDecoration: 'none' }}>
              Ver todos →
            </Link>
          </div>
          {proyectosActivos.length === 0 ? (
            <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
              Sin proyectos operativos
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {proyectosActivos.map((p) => {
                const avance = Number(p.avance_general)
                const badge = FASE_BADGE[p.fase]
                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/proyectos/${p.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: 7,
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 6 }}>{p.codigo}</span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: '#1a1d1e',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.nombre}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 6px',
                            borderRadius: 4,
                            backgroundColor: badge.bg,
                            color: badge.color,
                            flexShrink: 0,
                            marginLeft: 8,
                          }}
                        >
                          {FASE_LABEL[p.fase]}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, backgroundColor: '#e8eaed', borderRadius: 2 }}>
                          <div
                            style={{
                              height: 4,
                              width: `${avance}%`,
                              backgroundColor: '#004aad',
                              borderRadius: 2,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{avance}%</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actividad reciente */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '0.5px solid #e8eaed',
          borderRadius: 10,
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e' }}>Actividad reciente</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>Últimas {actividadesRecientes.length} acciones</span>
        </div>
        {actividadesRecientes.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>
            Sin actividad registrada
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {actividadesRecientes.map((a) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '7px 8px',
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: '#f4f6f8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#5b5b5b',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {TIPO_ICON[a.tipo] ?? <IconCircleDot size={13} strokeWidth={1.6} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#1a1d1e', lineHeight: 1.4 }}>
                    {a.descripcion}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                    {a.proyecto.codigo} · {a.proyecto.nombre} · {a.usuario.nombre}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#b0b7c3', flexShrink: 0, paddingTop: 2 }}>
                  {timeAgo(a.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
