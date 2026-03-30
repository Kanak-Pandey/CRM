import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL;

// This check helps you debug in the Vercel logs immediately
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined. Check your Vercel Environment Variables.");
}

const pool = new Pool({ connectionString })
const adapter = new PrismaNeon(pool)
export const prisma = new PrismaClient({ adapter })