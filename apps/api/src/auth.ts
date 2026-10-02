import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { count, eq, ne } from 'drizzle-orm'
import { db } from './db/index.js'
import { accounts, incomeSettings, sessions, users, verifications } from './db/schema.js'

export const MEMBER_COLORS = ['#ec4899', '#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6', '#f97316'] as const
const authSecret = process.env.BETTER_AUTH_SECRET
if (process.env.NODE_ENV === 'production' && !authSecret) {
  throw new Error('BETTER_AUTH_SECRET must be configured in production')
}

export const auth = betterAuth({
  appName: 'シフト管理',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:8787',
  secret: authSecret ?? 'local-development-secret-change-before-deploy-0001',
  trustedOrigins: [...new Set([process.env.BETTER_AUTH_URL, process.env.WEB_ORIGIN, 'http://localhost:5173', 'http://localhost:8080'].filter((origin): origin is string => Boolean(origin)))],
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: { user: users, session: sessions, account: accounts, verification: verifications },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      console.info(`Password reset for ${user.email}: ${url}`)
    },
  },
  user: {
    additionalFields: {
      phone: { type: 'string', required: false, input: true },
      initial: { type: 'string', required: false, input: false },
      color: { type: 'string', required: false, input: false },
      role: { type: 'string', required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const initial = user.name.trim().slice(0, 1) || '?'
          const colorCounts = await db.select({ color: users.color, total: count() }).from(users).where(ne(users.id, user.id)).groupBy(users.color)
          const assignedCounts = new Map(colorCounts.map(({ color, total }) => [color, total]))
          const minimum = Math.min(...MEMBER_COLORS.map((color) => assignedCounts.get(color) ?? 0))
          const leastUsed = MEMBER_COLORS.filter((color) => (assignedCounts.get(color) ?? 0) === minimum)
          const color = leastUsed[Math.floor(Math.random() * leastUsed.length)]
          const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean)
          const role = adminEmails.includes(user.email.toLowerCase()) ? 'admin' : 'staff'
          await db.update(users).set({ initial, color, role }).where(eq(users.id, user.id))
          await db.insert(incomeSettings).values({ userId: user.id }).onConflictDoNothing()
        },
      },
    },
  },
})
