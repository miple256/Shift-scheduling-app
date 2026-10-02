export function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function todayKey(now: Date) {
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate())
}

export function calcHours(start: string, end: string) {
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  return (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60
}

export function formatCurrency(amount: number) {
  return `¥${amount.toLocaleString('ja-JP')}`
}

export function formatDateLabel(dateString: string, isToday: boolean) {
  const [year, month, day] = dateString.split('-').map(Number)
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  const dayOfWeek = new Date(year, month - 1, day).getDay()
  return isToday ? `今日（${month}月${day}日・${dayNames[dayOfWeek]}）` : `${month}月${day}日（${dayNames[dayOfWeek]}）`
}
