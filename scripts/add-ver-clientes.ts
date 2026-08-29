/**
 * Script: add-ver-clientes.ts
 *
 * Agrega `ver_clientes: true` al JSON de permisos de todos los usuarios
 * no-gerente que no tengan ese permiso definido todavía.
 *
 * Ejecución (dry-run para revisar sin escribir):
 *   npx tsx scripts/add-ver-clientes.ts --dry-run
 *
 * Ejecución real:
 *   npx tsx scripts/add-ver-clientes.ts
 */

import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'

const isDryRun = process.argv.includes('--dry-run')

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log(`\n${isDryRun ? '🔍 DRY-RUN — no se escribirá nada en la BD' : '✏️  MODO REAL — se actualizará la BD'}\n`)

  try {
    const usuarios = await prisma.usuario.findMany({
      where: { rol: { not: 'gerente' } },
      select: { id: true, nombre: true, correo: true, rol: true, permisos: true },
      orderBy: { nombre: 'asc' },
    })

    console.log(`Usuarios no-gerente encontrados: ${usuarios.length}\n`)

    let actualizados = 0
    let omitidos    = 0

    for (const usuario of usuarios) {
      const permisos = usuario.permisos as Record<string, unknown>

      if ('ver_clientes' in permisos) {
        console.log(`  OMITIR     ${usuario.nombre} <${usuario.correo}> — ya tiene ver_clientes: ${permisos.ver_clientes}`)
        omitidos++
        continue
      }

      const nuevosPermisos = { ...permisos, ver_clientes: true }

      if (!isDryRun) {
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { permisos: nuevosPermisos },
        })
      }

      console.log(`  ACTUALIZAR ${usuario.nombre} <${usuario.correo}> — se añadirá ver_clientes: true${isDryRun ? ' (dry-run)' : ''}`)
      actualizados++
    }

    console.log(`\n─────────────────────────────────────────`)
    console.log(`  Actualizados : ${actualizados}`)
    console.log(`  Omitidos     : ${omitidos} (ya tenían ver_clientes)`)
    if (isDryRun) {
      console.log(`\n  Sin cambios aplicados (modo dry-run).`)
      console.log(`  Para aplicar, ejecuta sin --dry-run.`)
    }
    console.log(`─────────────────────────────────────────\n`)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
