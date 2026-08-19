'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  IconChevronDown,
  IconSettings,
  IconLogout,
} from '@tabler/icons-react'

interface TopbarProps {
  user?: { nombre: string; rol: string } | null
}

function getInitials(nombre: string) {
  return nombre
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const ROLES_LABEL: Record<string, string> = {
  gerente: 'Gerente',
  ingeniero_residente: 'Ing. Residente',
  administrativo: 'Administrativo',
  campo: 'Campo',
}

const dropdownItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '8px 14px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  color: '#374151',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  letterSpacing: '-0.01em',
}

export default function Topbar({ user }: TopbarProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div style={{
      height: 48,
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 20px',
      flexShrink: 0,
      zIndex: 10,
    }}>
      {user && (
        <div ref={ref} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 6px',
              borderRadius: 6,
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: '#004aad',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              letterSpacing: '0.02em',
            }}>
              {getInitials(user.nombre)}
            </div>

            {/* Name + role */}
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#111827',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
              }}>
                {user.nombre}
              </div>
              <div style={{
                fontSize: 11,
                color: '#9ca3af',
                whiteSpace: 'nowrap',
                lineHeight: 1.3,
              }}>
                {ROLES_LABEL[user.rol] ?? user.rol}
              </div>
            </div>

            <IconChevronDown
              size={12}
              strokeWidth={2}
              color="#9ca3af"
              style={{
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
              }}
            />
          </button>

          {open && (
            <div style={{
              position: 'absolute',
              top: 40,
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              minWidth: 196,
              zIndex: 200,
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', letterSpacing: '-0.01em' }}>
                  {user.nombre}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                  {ROLES_LABEL[user.rol] ?? user.rol}
                </div>
              </div>

              <button
                onClick={() => { setOpen(false); router.push('/dashboard/configuracion') }}
                style={dropdownItem}
              >
                <IconSettings size={14} strokeWidth={1.5} color="#6b7280" />
                Configuración
              </button>

              <div style={{ height: '1px', backgroundColor: '#f3f4f6' }} />

              <button onClick={handleLogout} style={{ ...dropdownItem, color: '#b91c1c' }}>
                <IconLogout size={14} strokeWidth={1.5} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
