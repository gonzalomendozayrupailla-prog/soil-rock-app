import { createClient } from '@supabase/supabase-js'

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin: ReturnType<typeof createClient>
}

function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      '[supabase] Faltan variables de entorno: ' +
        (!url ? 'SUPABASE_URL ' : '') +
        (!key ? 'SUPABASE_SERVICE_ROLE_KEY' : '')
    )
  }

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
