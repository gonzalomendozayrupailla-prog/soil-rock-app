import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const usuario = await prisma.usuario.upsert({
    where: { correo: 'anthony@soilrock.pe' },
    update: {},
    create: {
      nombre: 'Anthony',
      correo: 'anthony@soilrock.pe',
      rol: 'gerente',
      permisos: {
        ver_proyectos: true,
        editar_proyectos: true,
        ver_documentos: true,
        subir_documentos: true,
        ver_reportes_campo: true,
        editar_reportes_campo: true,
        ver_dashboard: true,
        ver_montos: true,
        ver_comercial: true,
      },
      activo: true,
    },
  })

  console.log('Usuario creado:', usuario.correo)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
