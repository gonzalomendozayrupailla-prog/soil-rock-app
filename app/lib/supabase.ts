import { createClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForSupabase = globalThis as unknown as { supabaseAdmin: any }

// No se crea ningún cliente al importar el módulo.
// Solo se instancia cuando se llama getSupabaseAdmin() en runtime.
export function getSupabaseAdmin() {
  if (globalForSupabase.supabaseAdmin) return globalForSupabase.supabaseAdmin

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      '[supabase] Faltan variables de entorno: ' +
        (!url ? 'SUPABASE_URL ' : '') +
        (!key ? 'SUPABASE_SERVICE_ROLE_KEY' : '')
    )
  }

  const client = createClient(url, key, { auth: { persistSession: false } })
  if (process.env.NODE_ENV !== 'production') {
    globalForSupabase.supabaseAdmin = client
  }
  return client
}

export const BUCKET = 'documentos'

export async function ensureBucket() {
  const admin = getSupabaseAdmin()
  const { data: buckets, error: listError } = await admin.storage.listBuckets()
  if (listError) throw listError
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exists = buckets?.some((b: any) => b.name === BUCKET)
  if (!exists) {
    const { error: createError } = await admin.storage.createBucket(BUCKET, { public: false })
    if (createError) throw createError
  }
}
