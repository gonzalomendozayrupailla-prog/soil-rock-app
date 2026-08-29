import { cookies } from 'next/headers'
import Link from 'next/link'
import { IconUserCog, IconChevronRight } from '@tabler/icons-react'
import { verifyToken } from '@/app/lib/session'
import { prisma } from '@/app/lib/prisma'
import ConfiguracionEmpresaForm from './ConfiguracionEmpresaForm'

export default async function ConfiguracionPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const session = token ? await verifyToken(token) : null
  const isGerente = session?.rol === 'gerente'

  const config = await prisma.configuracionEmpresa.findFirst()
  const initialData = config
    ? { razon_social: config.razon_social, ruc: config.ruc }
    : null

  return (
    <div style={{ padding: 28, maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: '#1a1d1e', margin: 0 }}>Configuración</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '3px 0 0' }}>Ajustes generales de la plataforma</p>
      </div>

      {/* Datos de la empresa — editable para gerentes */}
      <ConfiguracionEmpresaForm initialData={initialData} isGerente={isGerente} />

      {/* Logo */}
      <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e', margin: '0 0 16px' }}>Logo</h2>
        <div style={{ padding: '12px 14px', backgroundColor: '#f9fafb', border: '0.5px solid #e8eaed', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" style={{ height: 32, width: 'auto' }} />
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            El logo se actualiza reemplazando el archivo{' '}
            <code style={{ fontSize: 11, backgroundColor: '#e8eaed', padding: '1px 5px', borderRadius: 4 }}>public/logo.png</code>
          </span>
        </div>
      </div>

      {/* Administración */}
      <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, overflow: 'hidden' }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e', margin: 0, padding: '14px 20px', borderBottom: '0.5px solid #f4f6f8' }}>
          Administración
        </h2>
        <Link
          href="/dashboard/usuarios"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', textDecoration: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#e8f0fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconUserCog size={16} style={{ color: '#004aad' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1d1e' }}>Gestión de usuarios</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Crear usuarios, asignar roles y permisos</div>
            </div>
          </div>
          <IconChevronRight size={16} style={{ color: '#d1d5db' }} />
        </Link>
      </div>
    </div>
  )
}
