import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { and, eq, gte, lt } from 'drizzle-orm'
import { db } from '../db/index.js'
import { shifts, users } from '../db/schema.js'
import { currentSession } from '../lib/session.js'
import { dateSchema, shiftTypeSchema, timeSchema } from '../lib/validation.js'
import { z } from 'zod'

const createSchema = z.object({
  shifts: z.array(z.object({
    date: dateSchema,
    type: shiftTypeSchema,
    startTime: timeSchema,
    endTime: timeSchema,
  }).refine((value) => value.endTime > value.startTime, { message: '終了時刻は開始時刻より後にしてください' })).min(1).max(124),
})
const updateTimeSchema = z.object({ startTime: timeSchema, endTime: timeSchema })
  .refine((value) => value.endTime > value.startTime, { message: '終了時刻は開始時刻より後にしてください' })

export const shiftsRoute = new Hono()
  .get('/', async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const month = c.req.query('month')
    const filters = [eq(shifts.userId, session.user.id)]
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, monthNumber] = month.split('-').map(Number)
      const nextMonth = monthNumber === 12 ? `${year + 1}-01` : `${year}-${String(monthNumber + 1).padStart(2, '0')}`
      filters.push(gte(shifts.date, `${month}-01`), lt(shifts.date, `${nextMonth}-01`))
    }
    return c.json(await db.select().from(shifts).where(and(...filters)).orderBy(shifts.date))
  })
  .get('/members', async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const date = dateSchema.safeParse(c.req.query('date'))
    if (!date.success) return c.json({ error: '有効な日付を指定してください' }, 400)
    const rows = await db.select({ id: users.id, name: users.name, initial: users.initial, color: users.color, type: shifts.type })
      .from(shifts).innerJoin(users, eq(shifts.userId, users.id)).where(eq(shifts.date, date.data))
    return c.json(rows)
  })
  .post('/', zValidator('json', createSchema), async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const { shifts: requestedShifts } = c.req.valid('json')
    const inserted = db.transaction((tx) => {
      let count = 0
      for (const shift of requestedShifts) {
        const result = tx.insert(shifts).values({ id: crypto.randomUUID(), userId: session.user.id, ...shift }).onConflictDoNothing().run()
        count += result.changes
      }
      return count
    })
    return c.json({ created: inserted })
  })
  .patch('/:id', zValidator('json', updateTimeSchema), async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const values = c.req.valid('json')
    const result = await db.update(shifts).set(values).where(and(eq(shifts.id, c.req.param('id')), eq(shifts.userId, session.user.id)))
    return result.changes ? c.json({ ok: true }) : c.json({ error: 'シフトが見つかりません' }, 404)
  })
  .delete('/:id', async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const result = await db.delete(shifts).where(and(eq(shifts.id, c.req.param('id')), eq(shifts.userId, session.user.id)))
    return result.changes ? c.body(null, 204) : c.json({ error: 'シフトが見つかりません' }, 404)
  })
