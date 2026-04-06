import 'dotenv/config'; // Use the self-executing import at the VERY top
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

const connectionString =
  process.env.DATABASE_URL ||
  "PASTE_YOUR_NEON_POOLER_URL_HERE";
// This will show up in your Vercel logs if it's still missing
if (!connectionString) {
    console.error("CRITICAL: DATABASE_URL is missing from process.env");
}

const pool = new Pool({ connectionString })
const adapter = new PrismaNeon(pool)
export const prisma = new PrismaClient({ adapter })