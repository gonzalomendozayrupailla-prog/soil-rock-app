import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'
import { createClient } from '@supabase/supabase-js'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const BUCKET = 'documentos'

async function limpiarStorage() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.warn('Sin credenciales de Supabase, omitiendo limpieza de storage.')
    return
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  // Listar y borrar todos los archivos del bucket
  const { data: files, error } = await supabase.storage.from(BUCKET).list('', { limit: 1000 })
  if (error) { console.warn('Error al listar storage:', error.message); return }
  if (!files || files.length === 0) { console.log('Storage ya estaba vacio.'); return }

  // Listar recursivamente (carpetas por proyecto)
  const allPaths: string[] = []
  for (const item of files) {
    if (item.metadata) {
      allPaths.push(item.name)
    } else {
      // Es carpeta, listar contenido
      const { data: inner } = await supabase.storage.from(BUCKET).list(item.name, { limit: 1000 })
      if (inner) {
        for (const f of inner) allPaths.push(`${item.name}/${f.name}`)
      }
    }
  }

  if (allPaths.length > 0) {
    const { error: delErr } = await supabase.storage.from(BUCKET).remove(allPaths)
    if (delErr) console.warn('Error al borrar archivos:', delErr.message)
    else console.log(`Storage: ${allPaths.length} archivo(s) eliminado(s).`)
  } else {
    console.log('Storage: sin archivos para borrar.')
  }
}

async function main() {
  console.log('Limpiando base de datos...')

  // Borrar en orden correcto (hijos antes que padres)
  await prisma.auditoriaLog.deleteMany()
  await prisma.comentarioTarea.deleteMany()
  await prisma.subtarea.deleteMany()
  await prisma.personalCampo.deleteMany()
  await prisma.equipoCampo.deleteMany()
  await prisma.partidaValorizacion.deleteMany()
  await prisma.tarea.deleteMany()
  await prisma.reporteCampo.deleteMany()
  await prisma.factura.deleteMany()
  await prisma.valorizacion.deleteMany()
  await prisma.garantia.deleteMany()
  await prisma.actividad.deleteMany()
  await prisma.documento.deleteMany()
  await prisma.carpetaDocumento.deleteMany()
  await prisma.proyecto.deleteMany()
  await prisma.contactoCliente.deleteMany()
  await prisma.cliente.deleteMany()

  console.log('Base de datos limpia.')

  await limpiarStorage()

  console.log('Listo. La app esta nueva de paquete.')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
