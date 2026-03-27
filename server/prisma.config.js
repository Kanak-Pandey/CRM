import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Since the config is in the same folder as the prisma/ directory:
  schema: './prisma/schema.prisma', 
  datasource: {
    url: env('DIRECT_URL'),
  },
})