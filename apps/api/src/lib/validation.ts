import { z } from 'zod'

export const shiftTypeSchema = z.enum(['lunch', 'dinner'])
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で指定してください')
export const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, '時刻はHH:mm形式で指定してください')

export function todayJST() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date())
}
