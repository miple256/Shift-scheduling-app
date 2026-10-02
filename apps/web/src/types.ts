export type AuthScreen = 'login' | 'signup' | 'reset'
export type Screen = 'home' | 'calendar' | 'shift-change' | 'shift-entry' | 'mypage' | 'income-settings' | 'help'
export type ShiftType = 'lunch' | 'dinner'

export interface Shift {
  id?: string
  date: string
  type: ShiftType
  startTime: string
  endTime: string
  memberId: string
}

export interface Member {
  id: string
  name: string
  initial: string
  color: string
}

export interface UserProfile {
  name: string
  email: string
  phone: string
  color: MemberColor;
}

export const MEMBER_COLORS = ['#ec4899', '#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6', '#f97316'] as const;
export type MemberColor = typeof MEMBER_COLORS[number];

export interface IncomeSettings {
  hourlyWage: number
  nightBonus: number
  holidayBonus: number
  transportationFee: number
  showForecast: boolean
}

export interface TimePreset {
  label: string
  startTime: string
  endTime: string
  type: ShiftType | 'full'
}

export interface HelpItem {
  id: string
  q: string
  a: string
  author: string
  approved: boolean
}
