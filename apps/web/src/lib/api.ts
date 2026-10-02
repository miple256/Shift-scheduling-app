import { hc } from 'hono/client'
import type { AppType } from '../../../api/src/index.js'

const fetchWithCredentials: typeof fetch = (input, init) => fetch(input, { ...init, credentials: 'include' })

export const api = hc<AppType>('/', {
  fetch: fetchWithCredentials,
})
