'use client'

import { createContext, useContext } from 'react'

interface SessionUser {
  nombre: string
  rol: string
  permisos: Record<string, boolean>
}

const SessionContext = createContext<SessionUser | null>(null)

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser | null
  children: React.ReactNode
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
}

/**
 * Retorna true si el usuario tiene el permiso activo.
 * Si el permiso no existe en el objeto, se permite por defecto.
 */
export function usePuede(permiso: string): boolean {
  const session = useContext(SessionContext)
  if (!session) return false
  return session.permisos[permiso] !== false
}
