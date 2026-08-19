'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface LayoutClientProps {
  children: React.ReactNode
  user?: { nombre: string; rol: string; permisos: Record<string, boolean> } | null
}

export default function LayoutClient({ children, user }: LayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false)

  function toggle() {
    setCollapsed(c => !c)
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#f4f6f8',
      }}
    >
      <Sidebar user={user} collapsed={collapsed} onCollapse={toggle} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <Topbar user={user} />
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
