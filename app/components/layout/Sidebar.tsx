'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  IconLayoutDashboard,
  IconBriefcase2,
  IconUsers,
  IconFolderOpen,
  IconSettings,
  IconLogout,
  IconCheckbox,
  IconUserCog,
} from '@tabler/icons-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard',  href: '/dashboard',           icon: <IconLayoutDashboard size={16} strokeWidth={1.6} /> },
      { label: 'Mis tareas', href: '/dashboard/mis-tareas', icon: <IconCheckbox size={16} strokeWidth={1.6} /> },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { label: 'Pipeline', href: '/dashboard/pipeline', icon: <IconBriefcase2 size={16} strokeWidth={1.6} /> },
      { label: 'Clientes', href: '/dashboard/clientes', icon: <IconUsers size={16} strokeWidth={1.6} /> },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Proyectos', href: '/dashboard/proyectos', icon: <IconFolderOpen size={16} strokeWidth={1.6} /> },
    ],
  },
  {
    title: 'General',
    items: [
      { label: 'Usuarios',      href: '/dashboard/usuarios',      icon: <IconUserCog size={16} strokeWidth={1.6} /> },
      { label: 'Configuracion', href: '/dashboard/configuracion', icon: <IconSettings size={16} strokeWidth={1.6} /> },
    ],
  },
]

function getInitials(nombre: string) {
  return nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface SidebarProps {
  user?: { nombre: string; rol: string } | null
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const ROLES_LABEL: Record<string, string> = {
    gerente: 'Gerente',
    ingeniero_residente: 'Ing. Residente',
    administrativo: 'Administrativo',
    campo: 'Campo',
  }

  return (
    <aside
      style={{
        width: 205,
        minWidth: 205,
        backgroundColor: '#ffffff',
        borderRight: '0.5px solid #e8eaed',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '0.5px solid #e8eaed',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Soil Rock"
          style={{ width: 130, height: 'auto', display: 'block' }}
        />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {NAV.map((section) => (
          <div key={section.title} style={{ marginBottom: 2 }}>
            <span
              style={{
                display: 'block',
                padding: '8px 16px 3px',
                fontSize: 10,
                fontWeight: 600,
                color: '#b0b7c3',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}
            >
              {section.title}
            </span>
            {section.items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    margin: '1px 6px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    color: active ? '#004aad' : '#5b5b5b',
                    backgroundColor: active ? '#e8f0fd' : 'transparent',
                    textDecoration: 'none',
                  }}
                >
                  <span style={{ color: active ? '#004aad' : '#9ca3af', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ borderTop: '0.5px solid #e8eaed', padding: '6px' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 13,
            color: '#5b5b5b',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <span style={{ color: '#9ca3af' }}>
            <IconLogout size={16} strokeWidth={1.6} />
          </span>
          Cerrar sesión
        </button>
      </div>

      {/* User */}
      {user && (
        <div
          style={{
            borderTop: '0.5px solid #e8eaed',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: '#004aad',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {getInitials(user.nombre)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#1a1d1e',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.nombre}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#9ca3af',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {ROLES_LABEL[user.rol] ?? user.rol}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
