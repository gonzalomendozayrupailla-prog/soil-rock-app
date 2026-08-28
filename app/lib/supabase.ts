import { createClient } from '@supabase/supabase-js'

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin: ReturnType<typeof createClient>
}

function createSupabaseAdmin() {
  // Durante el build de Next.js las env vars no están disponibles.
  // Usamos placeholder para que el módulo pueda importarse sin error;
  // en runtime Vercel inyecta las variables reales.
  const url = process.env.SUPABASE_URL ?? 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder'
  return createClient(url, key, { auth: { persistSession: false } })
}

export const supabaseAdmin =
  globalForSupabase.supabaseAdmin ?? createSupabaseAdmin()

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabaseAdmin = supabaseAdmin
}

export const BUCKET = 'documentos'

export async function ensureBucket() {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
  if (listError) throw listError
  const exists = buckets?.some((b) => b.name === BUCKET)
  if (!exists) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET, { public: false })
    if (createError) throw createError
  }
}
