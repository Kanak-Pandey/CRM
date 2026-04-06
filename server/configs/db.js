import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

// 👇 IMPORTANT CHANGE
const connectionString ="postgresql://neondb_owner:npg_E9pIKSzwPD6O@ep-dark-mode-amhw8ozu-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

if (!connectionString) {
  throw new Error("❌ No DB connection string found in ANY env variable");
}

const pool = new Pool({ connectionString })
const adapter = new PrismaNeon(pool)

export const prisma = new PrismaClient({ adapter })