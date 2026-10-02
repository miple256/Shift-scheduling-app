import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { helpItems, users } from '../db/schema.js'
import { currentSession } from '../lib/session.js'

const helpSchema = z.object({ question: z.string().trim().min(1).max(500), answer: z.string().trim().min(1).max(3000) })

export const helpRoute = new Hono()
  .get('/', async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
    const rows = await db.select({ id: helpItems.id, question: helpItems.question, answer: helpItems.answer, approved: helpItems.approved, createdAt: helpItems.createdAt, author: users.name })
      .from(helpItems).innerJoin(users, eq(helpItems.authorUserId, users.id))
      .where(user?.role === 'admin' ? undefined : eq(helpItems.approved, true)).orderBy(desc(helpItems.createdAt))
    return c.json(rows)
  })
  .post('/', zValidator('json', helpSchema), async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const input = c.req.valid('json')
    const id = crypto.randomUUID()
    await db.insert(helpItems).values({ id, question: input.question, answer: input.answer, authorUserId: session.user.id, createdAt: new Date() })
    return c.json({ id, approved: false }, 201)
  })
  .patch('/:id/approve', async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
    if (user?.role !== 'admin') return c.json({ error: '管理者権限が必要です' }, 403)
    const result = await db.update(helpItems).set({ approved: true }).where(eq(helpItems.id, c.req.param('id')))
    return result.changes ? c.json({ ok: true }) : c.json({ error: '投稿が見つかりません' }, 404)
  })
