'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  IconLayoutDashboard,
  IconBriefcase2,
  IconUsers,
  IconFolderOpen,
  IconSettings,
  IconCheckbox,
  IconUserCog,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react'
import { usePuede } from '@/app/lib/session-context'

interface SidebarProps {
  user?: { nombre: string; rol: string; permisos?: Record<string, boolean> } | null
  collapsed: boolean
  onCollapse: () => void
}


function navItem(active: boolean, collapsed: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: collapsed ? '8px 0' : '7px 10px',
    margin: collapsed ? '1px 4px' : '1px 8px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    color: active ? '#004aad' : '#374151',
    backgroundColor: active ? '#eff6ff' : 'transparent',
    textDecoration: 'none',
    justifyContent: collapsed ? 'center' : 'flex-start',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.01em',
    transition: 'background-color 0.1s',
  }
}

export default function Sidebar({ user, collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname()
  const verDashboard = usePuede('ver_dashboard')
  const verProyectos = usePuede('ver_proyectos')
  const verComercial = usePuede('ver_comercial')

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const w = collapsed ? 52 : 216

  function SectionLabel({ children }: { children: string }) {
    return (
      <span style={{
        display: 'block',
        padding: '12px 18px 4px',
        fontSize: 10,
        fontWeight: 600,
        color: '#9ca3af',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        {children}
      </span>
    )
  }

  function NavLink({
    href,
    icon,
    children,
    active,
  }: {
    href: string
    icon: React.ReactNode
    children: string
    active: boolean
  }) {
    return (
      <Link href={href} title={collapsed ? children : undefined} style={navItem(active, collapsed)}>
        <span style={{ color: active ? '#004aad' : '#9ca3af', flexShrink: 0, display: 'flex' }}>
          {icon}
        </span>
        {!collapsed && children}
      </Link>
    )
  }

  return (
    <aside style={{
      width: w,
      minWidth: w,
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      flexShrink: 0,
      transition: 'width 0.2s ease, min-width 0.2s ease',
    }}>

      {/* Logo */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 72,
      }}>
        {!collapsed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo.png" alt="Soil Rock" style={{ height: 180, width: 'auto', display: 'block' }} />
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>

        {/* Principal */}
        {!collapsed && <SectionLabel>Principal</SectionLabel>}

        {verDashboard && (
          <NavLink href="/dashboard" icon={<IconLayoutDashboard size={15} strokeWidth={1.5} />} active={isActive('/dashboard')}>
            Dashboard
          </NavLink>
        )}

        <NavLink href="/dashboard/mis-tareas" icon={<IconCheckbox size={15} strokeWidth={1.5} />} active={isActive('/dashboard/mis-tareas')}>
          Mis tareas
        </NavLink>

        {/* Comercial */}
        {verComercial && (
          <>
            {!collapsed && <SectionLabel>Comercial</SectionLabel>}

            <NavLink href="/dashboard/pipeline" icon={<IconBriefcase2 size={15} strokeWidth={1.5} />} active={isActive('/dashboard/pipeline')}>
              Pipeline
            </NavLink>

            <NavLink href="/dashboard/clientes" icon={<IconUsers size={15} strokeWidth={1.5} />} active={isActive('/dashboard/clientes')}>
              Clientes
            </NavLink>
          </>
        )}

        {/* Operaciones */}
        {verProyectos && (
          <>
            {!collapsed && <SectionLabel>Operaciones</SectionLabel>}
            <NavLink href="/dashboard/proyectos" icon={<IconFolderOpen size={15} strokeWidth={1.5} />} active={isActive('/dashboard/proyectos')}>
              Proyectos
            </NavLink>
          </>
        )}

        {/* General */}
        {!collapsed && <SectionLabel>General</SectionLabel>}

        {user?.rol === 'gerente' && (
          <NavLink href="/dashboard/usuarios" icon={<IconUserCog size={15} strokeWidth={1.5} />} active={isActive('/dashboard/usuarios')}>
            Usuarios
          </NavLink>
        )}

        <NavLink href="/dashboard/configuracion" icon={<IconSettings size={15} strokeWidth={1.5} />} active={isActive('/dashboard/configuracion')}>
          Configuración
        </NavLink>
      </nav>

      {/* Colapsar */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '6px 8px', flexShrink: 0 }}>
        <button
          onClick={onCollapse}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '7px',
            borderRadius: 6,
            color: '#9ca3af',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {collapsed
            ? <IconChevronsRight size={15} strokeWidth={1.5} />
            : <IconChevronsLeft size={15} strokeWidth={1.5} />
          }
        </button>
      </div>
    </aside>
  )
}
