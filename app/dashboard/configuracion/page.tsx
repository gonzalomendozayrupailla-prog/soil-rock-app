import Link from 'next/link'
import { IconUserCog, IconChevronRight } from '@tabler/icons-react'

export default function ConfiguracionPage() {
  return (
    <div style={{ padding: 28, maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: '#1a1d1e', margin: 0 }}>Configuración</h1>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '3px 0 0' }}>Ajustes generales de la plataforma</p>
      </div>

      {/* Datos de la empresa */}
      <div style={{ backgroundColor: '#ffffff', border: '0.5px solid #e8eaed', borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#1a1d1e', margin: '0 0 16px' }}>Datos de la empresa</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Razón social
            </label>
            <div style={{ fontSize: 13, color: '#1a1d1e', padding: '7px 10px', backgroundColor: '#f9fafb', border: '0.5px solid #e8eaed', borderRadius: 6 }}>
              Soil Rock S.A.C.
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              RUC
            </label>
            <div style={{ fontSize: 13, color: '#1a1d1e', padding: '7px 10px', backgroundColor: '#f9fafb', border: '0.5px solid #e8eaed', borderRadius: 6 }}>
              —
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Logo
            </label>
            <div style={{ padding: '12px 14px', backgroundColor: '#f9fafb', border: '0.5px solid #e8eaed', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Logo" style={{ height: 32, width: 'auto' }} />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>El logo se actualiza reemplazando el archivo <code style={{ fontSize: 11, backgroundColor: '#e8eaed', padding: '1px 5px', borderRadius: 4 }}>public/logo.png</code></span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: '#b0b7c3', marginTop: 14, marginBottom: 0 }}>
          Para actualizar estos datos contacta al administrador del sistema.
        </p>
      </div>

      {/* Acceso rápido */}
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
