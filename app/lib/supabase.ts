import { createClient } from '@supabase/supabase-js'

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin: ReturnType<typeof createClient>
}

function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('[supabase] SUPABASE_URL presente:', !!url)
  console.log('[supabase] SUPABASE_SERVICE_ROLE_KEY presente:', !!key)

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
  console.log('[supabase] ensureBucket: listando buckets...')
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
  if (listError) {
    console.error('[supabase] ensureBucket: error al listar buckets:', listError)
    throw listError
  }
  console.log('[supabase] Buckets existentes:', buckets?.map((b) => b.name))
  const exists = buckets?.some((b) => b.name === BUCKET)
  if (!exists) {
    console.log(`[supabase] Bucket "${BUCKET}" no existe, creando...`)
    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
    if (createError) {
      console.error('[supabase] Error al crear bucket:', createError)
      throw createError
    }
    console.log(`[supabase] Bucket "${BUCKET}" creado correctamente.`)
  } else {
    console.log(`[supabase] Bucket "${BUCKET}" ya existe.`)
  }
}
