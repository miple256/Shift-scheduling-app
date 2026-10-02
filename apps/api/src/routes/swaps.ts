import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { and, eq, or } from 'drizzle-orm'
import { z } from 'zod'
import { alias } from 'drizzle-orm/sqlite-core'
import { db } from '../db/index.js'
import { shifts, shiftSwaps, users } from '../db/schema.js'
import { currentSession } from '../lib/session.js'
import { dateSchema, shiftTypeSchema, todayJST } from '../lib/validation.js'

const createSchema = z.object({ date: dateSchema, type: shiftTypeSchema, fromUserId: z.string().min(1), toUserId: z.string().min(1) })
const fromUser = alias(users, 'from_user')
const toUser = alias(users, 'to_user')

export const swapsRoute = new Hono()
  .get('/candidates', async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const date = dateSchema.safeParse(c.req.query('date'))
    const type = shiftTypeSchema.safeParse(c.req.query('type'))
    if (!date.success || !type.success) return c.json({ error: '日付とシフト種類を指定してください' }, 400)
    const rows = await db.select({ userId: shifts.userId, id: users.id, name: users.name, initial: users.initial, color: users.color })
      .from(shifts).innerJoin(users, eq(shifts.userId, users.id)).where(and(eq(shifts.date, date.data), eq(shifts.type, type.data)))
    const assignedIds = new Set(rows.map((row) => row.userId))
    const allUsers = await db.select({ id: users.id, name: users.name, initial: users.initial, color: users.color }).from(users).where(eq(users.role, 'staff'))
    return c.json({ assigned: rows.map(({ userId: _userId, ...member }) => member), available: allUsers.filter((member) => !assignedIds.has(member.id)) })
  })
  .get('/', async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const rows = await db.select({ id: shiftSwaps.id, date: shiftSwaps.date, type: shiftSwaps.type, startTime: shiftSwaps.startTime, endTime: shiftSwaps.endTime, fromUserId: shiftSwaps.fromUserId, toUserId: shiftSwaps.toUserId, createdAt: shiftSwaps.createdAt, counterpartReadAt: shiftSwaps.counterpartReadAt, fromName: fromUser.name, fromInitial: fromUser.initial, fromColor: fromUser.color, toName: toUser.name, toInitial: toUser.initial, toColor: toUser.color })
      .from(shiftSwaps).innerJoin(fromUser, eq(shiftSwaps.fromUserId, fromUser.id))
      .innerJoin(toUser, eq(shiftSwaps.toUserId, toUser.id))
      .where(or(eq(shiftSwaps.fromUserId, session.user.id), eq(shiftSwaps.toUserId, session.user.id)))
      .orderBy(shiftSwaps.createdAt)
    return c.json(rows)
  })
  .post('/', zValidator('json', createSchema), async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const { date, type, fromUserId, toUserId } = c.req.valid('json')
    if (fromUserId === toUserId) return c.json({ error: '同じ人は選べません' }, 400)
    if (fromUserId !== session.user.id && toUserId !== session.user.id) return c.json({ error: '自分が関わる交代のみ可能です' }, 403)
    if (date < todayJST()) return c.json({ error: '過去の日付は変更できません' }, 400)

    const [shift] = await db.select().from(shifts).where(and(eq(shifts.userId, fromUserId), eq(shifts.date, date), eq(shifts.type, type))).limit(1)
    if (!shift) return c.json({ error: '渡す人のシフトがありません' }, 409)
    const [conflict] = await db.select().from(shifts).where(and(eq(shifts.userId, toUserId), eq(shifts.date, date), eq(shifts.type, type))).limit(1)
    if (conflict) return c.json({ error: '引き受ける人はすでにその枠に入っています' }, 409)

    db.transaction((tx) => {
      tx.update(shifts).set({ userId: toUserId }).where(eq(shifts.id, shift.id)).run()
      tx.insert(shiftSwaps).values({ id: crypto.randomUUID(), date, type, startTime: shift.startTime, endTime: shift.endTime, fromUserId, toUserId, createdAt: new Date() }).run()
    })
    return c.json({ ok: true }, 201)
  })
  .post('/:id/read', async (c) => {
    const session = await currentSession(c)
    if (!session) return c.json({ error: 'ログインが必要です' }, 401)
    const updated = await db.update(shiftSwaps).set({ counterpartReadAt: new Date() }).where(and(eq(shiftSwaps.id, c.req.param('id')), eq(shiftSwaps.toUserId, session.user.id)))
    return updated.changes ? c.json({ ok: true }) : c.json({ error: '通知が見つかりません' }, 404)
  })
