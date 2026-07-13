import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const password_hash = await bcrypt.hash('soilrock123', 12)

  const usuario = await prisma.usuario.upsert({
    where: { correo: 'anthony@soilrock.pe' },
    update: {},
    create: {
      nombre: 'Anthony',
      correo: 'anthony@soilrock.pe',
      password_hash,
      rol: 'gerente',
      permisos: {
        ver_proyectos: true,
        editar_proyectos: true,
        ver_documentos: true,
        subir_documentos: true,
        ver_reportes_campo: true,
        editar_reportes_campo: true,
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
