/**
 * Migración: cambia sector 'Industrial' → 'Industria' en tablas clientes y proyectos.
 * Ejecutar UNA VEZ:
 *   npx tsx prisma/fix-sector-industrial.ts
 */

import { config } from 'dotenv'
config()

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // ── Clientes ──────────────────────────────────────────────────────────────
  const clientesAfectados = await prisma.cliente.findMany({
    where: { sector: 'Industrial' },
    select: { id: true, razon_social: true },
  })
  console.log(`Clientes con sector 'Industrial': ${clientesAfectados.length}`)

  for (const c of clientesAfectados) {
    await prisma.cliente.update({ where: { id: c.id }, data: { sector: 'Industria' } })
    console.log(`  ✓ Cliente: ${c.razon_social}`)
  }

  // ── Proyectos ─────────────────────────────────────────────────────────────
  const proyectosAfectados = await prisma.proyecto.findMany({
    where: { sector: 'Industrial' },
    select: { id: true, codigo: true, nombre: true },
  })
  console.log(`Proyectos con sector 'Industrial': ${proyectosAfectados.length}`)

  for (const p of proyectosAfectados) {
    await prisma.proyecto.update({ where: { id: p.id }, data: { sector: 'Industria' } })
    console.log(`  ✓ Proyecto: ${p.codigo} — ${p.nombre}`)
  }

  console.log(`\nCompletado: ${clientesAfectados.length} clientes, ${proyectosAfectados.length} proyectos actualizados.`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
