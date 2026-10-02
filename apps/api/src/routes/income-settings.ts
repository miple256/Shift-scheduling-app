import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/index.js'
import { incomeSettings } from '../db/schema.js'
import { currentSession } from '../lib/session.js'

const settingsSchema = z.object({
  hourlyWage: z.number().int().min(0).max(1_000_000),
  nightBonus: z.number().int().min(0).max(1_000_000),
  holidayBonus: z.number().int().min(0).max(1_000_000),
  transportationFee: z.number().int().min(0).max(1_000_000),
  showForecast: z.boolean(),
})

export const incomeSettingsRoute = new Hono()
  .get('/', async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const [settings] = await db.select().from(incomeSettings).where(eq(incomeSettings.userId, session.user.id)).limit(1)
    return c.json(settings ?? { userId: session.user.id, hourlyWage: 0, nightBonus: 0, holidayBonus: 0, transportationFee: 0, showForecast: true })
  })
  .put('/', zValidator('json', settingsSchema), async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const values = c.req.valid('json')
    await db.insert(incomeSettings).values({ userId: session.user.id, ...values }).onConflictDoUpdate({ target: incomeSettings.userId, set: values })
    return c.json({ ok: true })
  })
