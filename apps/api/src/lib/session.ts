import type { Context, MiddlewareHandler } from 'hono'
import { auth } from '../auth.js'

export type SessionData = NonNullable<Awaited<ReturnType<typeof getSession>>>

async function getSession(headers: Headers) {
  return auth.api.getSession({ headers })
}

export async function currentSession(c: Context) {
  return getSession(c.req.raw.headers)
}

export const requireSession: MiddlewareHandler = async (c, next) => {
  const session = await currentSession(c)
  if (!session) return c.json({ error: 'ログインが必要です' }, 401)
  c.set('session', session as never)
  await next()
}
