import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/app/lib/session'

export default async function RootPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (token) {
    const session = await verifyToken(token)
    if (session) redirect('/dashboard/proyectos')
  }

  redirect('/login')
}
