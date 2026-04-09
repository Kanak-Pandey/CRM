// server/configs/db.js
import 'dotenv/config' // ← Must be first

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig, Pool } from '@neondatabase/serverless'
import ws from 'ws'

// Required for local dev (not needed on Vercel/serverless)
neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set!')
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaNeon(pool)

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db