import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

// 👇 MUST use env (not hardcoded)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("❌ DATABASE_URL is missing in environment variables");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaNeon(pool);

export const prisma = new PrismaClient({
  adapter,
});