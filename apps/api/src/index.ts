import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './auth.js'
import { helpRoute } from './routes/help.js'
import { incomeSettingsRoute } from './routes/income-settings.js'
import { meRoute } from './routes/me.js'
import { shiftsRoute } from './routes/shifts.js'
import { swapsRoute } from './routes/swaps.js'

const app = new Hono()
  .use('/api/*', cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173', credentials: true }))
  .on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))
  .get('/api/health', (c) => c.json({ ok: true }))
  .route('/api/shifts', shiftsRoute)
  .route('/api/swaps', swapsRoute)
  .route('/api/income-settings', incomeSettingsRoute)
  .route('/api/me', meRoute)
  .route('/api/help', helpRoute)

export type AppType = typeof app

const port = Number(process.env.PORT ?? 8787)
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`)
})
