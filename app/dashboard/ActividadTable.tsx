'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  IconNotes,
  IconPhone,
  IconMail,
  IconFileText,
  IconArrowNarrowRight,
  IconBriefcase2,
  IconCircleDot,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react'

export interface ActividadItem {
  id: string
  tipo: string
  descripcion: string
  createdAt: string
  proyecto: { id: string; nombre: string; codigo: string }
  usuario: { nombre: string }
}

interface Props {
  actividades: ActividadItem[]
}

const TIPO_ICON: Record<string, React.ReactNode> = {
  nota:                <IconNotes             size={13} strokeWidth={1.5} />,
  llamada:             <IconPhone             size={13} strokeWidth={1.5} />,
  reunion:             <IconMail              size={13} strokeWidth={1.5} />,
  documento_recibido:  <IconFileText          size={13} strokeWidth={1.5} />,
  documento_enviado:   <IconFileText          size={13} strokeWidth={1.5} />,
  cambio_fase:         <IconArrowNarrowRight  size={13} strokeWidth={1.5} />,
  propuesta_enviada:   <IconBriefcase2        size={13} strokeWidth={1.5} />,
  observacion_cliente: <IconNotes             size={13} strokeWidth={1.5} />,
}

const TIPO_LABEL: Record<string, string> = {
  nota:                'Nota',
  llamada:             'Llamada',
  reunion:             'Reunión',
  documento_recibido:  'Doc. recibido',
  documento_enviado:   'Doc. enviado',
  cambio_fase:         'Cambio de fase',
  propuesta_enviada:   'Propuesta enviada',
  observacion_cliente: 'Observación',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

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
  padding: '11px 16px',
  fontSize: 13,
  color: '#374151',
  verticalAlign: 'middle',
  borderBottom: '1px solid #f3f4f6',
}

const PER_PAGE = 4

export default function ActividadTable({ actividades }: Props) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(actividades.length / PER_PAGE)
  const visible = actividades.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Actividad</th>
              <th style={TH}>Relacionado</th>
              <th style={TH}>Usuario</th>
              <th style={{ ...TH, textAlign: 'right' }}>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ ...TD, textAlign: 'center', color: '#9ca3af', padding: '24px 16px' }}>
                  Sin actividad registrada
                </td>
              </tr>
            ) : (
              visible.map(a => (
                <tr key={a.id}>
                  <td style={TD}>
                    <Link href={`/dashboard/proyectos/${a.proyecto.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          backgroundColor: '#f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6b7280',
                          flexShrink: 0,
                        }}>
                          {TIPO_ICON[a.tipo] ?? <IconCircleDot size={13} strokeWidth={1.5} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, color: '#111827', lineHeight: 1.4, letterSpacing: '-0.01em' }}>
                            {a.descripcion}
                          </div>
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
                            {TIPO_LABEL[a.tipo] ?? a.tipo}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </td>

                  <td style={TD}>
                    <Link href={`/dashboard/proyectos/${a.proyecto.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#004aad', letterSpacing: '-0.01em' }}>
                        {a.proyecto.codigo}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: '#9ca3af',
                        marginTop: 1,
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {a.proyecto.nombre}
                      </div>
                    </Link>
                  </td>

                  <td style={{ ...TD, fontSize: 13, color: '#4b5563' }}>
                    {a.usuario.nombre}
                  </td>

                  <td style={{ ...TD, textAlign: 'right', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {timeAgo(a.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: paginación + link */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderTop: '1px solid #f3f4f6',
      }}>
        <Link href="/dashboard/proyectos" style={{ fontSize: 12, color: '#004aad', textDecoration: 'none', fontWeight: 500 }}>
          Ver todas las actividades →
        </Link>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#9ca3af', marginRight: 8 }}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                color: page === 0 ? '#d1d5db' : '#4b5563',
                cursor: page === 0 ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconChevronLeft size={13} strokeWidth={2} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  fontSize: 12,
                  border: '1px solid #e5e7eb',
                  backgroundColor: page === i ? '#004aad' : '#ffffff',
                  color: page === i ? '#ffffff' : '#4b5563',
                  cursor: 'pointer',
                  fontWeight: page === i ? 600 : 400,
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                color: page === totalPages - 1 ? '#d1d5db' : '#4b5563',
                cursor: page === totalPages - 1 ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconChevronRight size={13} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
