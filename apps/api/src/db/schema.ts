import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  phone: text('phone'),
  initial: text('initial').notNull().default('?'),
  color: text('color').notNull().default('#6366f1'),
  role: text('role', { enum: ['staff', 'admin'] }).notNull().default('staff'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const sessions = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
})

export const accounts = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const verifications = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

export const shifts = sqliteTable('shifts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  type: text('type', { enum: ['lunch', 'dinner'] }).notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
}, (table) => ({
  uniqueShift: uniqueIndex('uniq_user_date_type').on(table.userId, table.date, table.type),
}))

export const shiftSwaps = sqliteTable('shift_swaps', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  type: text('type', { enum: ['lunch', 'dinner'] }).notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  fromUserId: text('from_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  toUserId: text('to_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  counterpartReadAt: integer('counterpart_read_at', { mode: 'timestamp' }),
})

export const incomeSettings = sqliteTable('income_settings', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  hourlyWage: integer('hourly_wage').notNull().default(0),
  nightBonus: integer('night_bonus').notNull().default(0),
  holidayBonus: integer('holiday_bonus').notNull().default(0),
  transportationFee: integer('transportation_fee').notNull().default(0),
  showForecast: integer('show_forecast', { mode: 'boolean' }).notNull().default(true),
})

export const helpItems = sqliteTable('help_items', {
  id: text('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  authorUserId: text('author_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  approved: integer('approved', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
