/**
 * Script de migración: convierte las URLs públicas de Supabase Storage
 * guardadas en documentos.url a storage paths relativos.
 *
 * Antes: https://xxx.supabase.co/storage/v1/object/public/documentos/proyecto_id/archivo.pdf
 * Después: proyecto_id/archivo.pdf
 *
 * Ejecutar UNA VEZ antes de hacer el bucket privado:
 *   npx tsx prisma/fix-doc-paths.ts
 */

import { config } from 'dotenv'
config()

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PREFIJO = /^https?:\/\/.+\/storage\/v1\/object\/public\/documentos\//

async function main() {
  const docs = await prisma.documento.findMany({
    select: { id: true, url: true },
  })

  const aConvertir = docs.filter((d) => d.url.startsWith('https://'))
  console.log(`Documentos a convertir: ${aConvertir.length} de ${docs.length}`)

  let ok = 0
  let errores = 0

  for (const doc of aConvertir) {
    const path = doc.url.replace(PREFIJO, '')
    if (path === doc.url) {
      console.error(`[!] No se pudo extraer path de: ${doc.url}`)
      errores++
      continue
    }
    await prisma.documento.update({
      where: { id: doc.id },
      data: { url: path },
    })
    console.log(`✓ ${doc.id}: ${path}`)
    ok++
  }

  console.log(`\nCompletado: ${ok} convertidos, ${errores} errores`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
