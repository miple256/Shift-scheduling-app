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
}

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
  type: ShiftType
}

export interface HelpItem {
  id: string
  q: string
  a: string
  author: string
  approved: boolean
}
