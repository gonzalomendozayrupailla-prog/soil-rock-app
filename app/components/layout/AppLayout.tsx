import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
  user?: { nombre: string; rol: string } | null
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#f4f6f8',
      }}
    >
      <Sidebar user={user} />
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  )
}
