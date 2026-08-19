import Link from 'next/link'
import { prisma } from '@/app/lib/prisma'
import { IconPlus, IconUsers } from '@tabler/icons-react'
import ExportarClientesButton from './ExportarClientesButton'

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    include: {
      _count: { select: { contactos: true } },
    },
    orderBy: { razon_social: 'asc' },
  })

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: '#1a1d1e', margin: 0 }}>
            Clientes
          </h1>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '3px 0 0' }}>
            {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado
            {clientes.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExportarClientesButton />
          <Link
            href="/dashboard/clientes/nuevo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#004aad',
              color: '#ffffff',
              padding: '7px 14px',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <IconPlus size={14} />
            Nuevo cliente
          </Link>
        </div>
      </div>

      {/* Table / Empty */}
      {clientes.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px dashed #e8eaed',
            borderRadius: 10,
            padding: 60,
            textAlign: 'center',
          }}
        >
          <IconUsers size={36} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 12px' }}>
            No hay clientes registrados.
          </p>
          <Link
            href="/dashboard/clientes/nuevo"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#004aad',
              textDecoration: 'underline',
            }}
          >
            Crear el primero
          </Link>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '0.5px solid #e8eaed',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e8eaed' }}>
                {['Razón social', 'RUC', 'Sector', 'Contactos', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '11px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom:
                      i < clientes.length - 1 ? '0.5px solid #e8eaed' : 'none',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 500, color: '#1a1d1e' }}>
                    <Link
                      href={`/dashboard/clientes/${c.id}`}
                      style={{ color: '#1a1d1e', textDecoration: 'none' }}
                    >
                      {c.razon_social}
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontFamily: 'monospace',
                      fontSize: 12,
                      color: '#6b7280',
                    }}
                  >
                    {c.ruc}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#5b5b5b' }}>{c.sector}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        backgroundColor: '#f4f6f8',
                        color: '#5b5b5b',
                        fontSize: 12,
                        fontWeight: 500,
                        padding: '2px 8px',
                        borderRadius: 999,
                      }}
                    >
                      {c._count.contactos} contacto{c._count.contactos !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <Link
                      href={`/dashboard/clientes/${c.id}`}
                      style={{ fontSize: 12, color: '#004aad', textDecoration: 'none' }}
                    >
                      Ver →
                    </Link>
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
