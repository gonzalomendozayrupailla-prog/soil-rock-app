import LayoutClient from './LayoutClient'
import { SessionProvider } from '@/app/lib/session-context'

interface AppLayoutProps {
  children: React.ReactNode
  user?: { nombre: string; rol: string; permisos: Record<string, boolean> } | null
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <SessionProvider user={user ?? null}>
      <LayoutClient user={user}>{children}</LayoutClient>
    </SessionProvider>
  )
}
