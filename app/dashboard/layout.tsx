import { cookies } from 'next/headers'
import { verifyToken } from '@/app/lib/session'
import AppLayout from '@/app/components/layout/AppLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  let user = null

  if (token) {
    const session = await verifyToken(token)
    if (session) {
      user = { nombre: session.nombre, rol: session.rol }
    }
  }

  return <AppLayout user={user}>{children}</AppLayout>
}
