/**
 * reset-db.ts
 * Borra todos los datos excepto usuarios con rol "gerente".
 * Uso: npx tsx scripts/reset-db.ts
 */

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Iniciando limpieza de base de datos...')

  await prisma.auditoriaLog.deleteMany()
  console.log('  auditoria_logs - OK')

  await prisma.comentarioTarea.deleteMany()
  console.log('  comentarios_tarea - OK')

  await prisma.subtarea.deleteMany()
  console.log('  subtareas - OK')

  await prisma.tarea.deleteMany()
  console.log('  tareas - OK')

  await prisma.personalCampo.deleteMany()
  console.log('  personal_campo - OK')

  await prisma.equipoCampo.deleteMany()
  console.log('  equipos_campo - OK')

  await prisma.reporteCampo.deleteMany()
  console.log('  reportes_campo - OK')

  await prisma.reporteAnclaje.deleteMany()
  console.log('  reportes_anclaje - OK')

  await prisma.reporteInyeccion.deleteMany()
  console.log('  reportes_inyeccion - OK')

  await prisma.documento.deleteMany()
  console.log('  documentos - OK')

  await prisma.carpetaDocumento.deleteMany()
  console.log('  carpetas_documento - OK')

  await prisma.actividad.deleteMany()
  console.log('  actividades - OK')

  await prisma.partidaValorizacion.deleteMany()
  console.log('  partidas_valorizacion - OK')

  await prisma.factura.deleteMany()
  console.log('  facturas - OK')

  await prisma.garantia.deleteMany()
  console.log('  garantias - OK')

  await prisma.valorizacion.deleteMany()
  console.log('  valorizaciones - OK')

  await prisma.proyecto.deleteMany()
  console.log('  proyectos - OK')

  await prisma.contactoCliente.deleteMany()
  console.log('  contactos_cliente - OK')

  await prisma.cliente.deleteMany()
  console.log('  clientes - OK')

  await prisma.usuario.deleteMany({ where: { rol: { not: 'gerente' } } })
  console.log('  usuarios no-gerentes - OK')

  const gerentes = await prisma.usuario.findMany({
    where: { rol: 'gerente' },
    select: { nombre: true, correo: true },
  })

  console.log('\nBase de datos limpia. Gerentes conservados:')
  gerentes.forEach(g => console.log(`  - ${g.nombre} (${g.correo})`))
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
