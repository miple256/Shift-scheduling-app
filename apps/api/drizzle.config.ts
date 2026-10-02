import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const databasePath = resolve(process.env.DB_PATH ?? './data/shift.db')
mkdirSync(dirname(databasePath), { recursive: true })

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: databasePath },
})
