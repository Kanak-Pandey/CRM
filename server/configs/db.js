// server/configs/db.js
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

export function createDb() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('❌ DATABASE_URL is not set!')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool)
  return new PrismaClient({ adapter })
}
