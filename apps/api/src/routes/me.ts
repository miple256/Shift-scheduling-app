import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { currentSession } from '../lib/session.js'

const profileSchema = z.object({ name: z.string().trim().min(1).max(100), phone: z.string().trim().max(40).nullable().optional() })

export const meRoute = new Hono()
  .get('/', async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const [profile] = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, initial: users.initial, color: users.color, role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1)
    return profile ? c.json(profile) : c.json({ error: 'ユーザーが見つかりません' }, 404)
  })
  .patch('/', zValidator('json', profileSchema), async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const input = c.req.valid('json')
    await db.update(users).set({ ...input, updatedAt: new Date(), initial: input.name.slice(0, 1) || '?' }).where(eq(users.id, session.user.id))
    return c.json({ ok: true })
  })
  .delete('/', async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    await db.delete(users).where(eq(users.id, session.user.id))
    return c.json({ ok: true })
  })
