import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, SessionPayload } from './session'

export async function requireAuth(req: NextRequest): Promise<
  { session: SessionPayload; error: null } |
  { session: null; error: NextResponse }
> {
  const token = req.cookies.get('token')?.value
  if (!token) {
    return { session: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }
  const session = await verifyToken(token)
  if (!session) {
    return { session: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }
  return { session, error: null }
}

export function requirePermiso(session: SessionPayload, permiso: string): NextResponse | null {
  if (session.rol === 'gerente') return null
  if (session.permisos[permiso] !== true) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }
  return null
}

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'dwg',
])

export function isAllowedExtension(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return ALLOWED_EXTENSIONS.has(ext)
}
