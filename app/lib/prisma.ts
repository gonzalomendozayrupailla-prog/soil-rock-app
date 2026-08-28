import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient
}

function createPrismaClient() {
  const connString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
  console.log('[prisma] CONNECTION STRING PREFIX:', connString?.substring(0, 30))
  const pool = new Pool({ connectionString: connString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
