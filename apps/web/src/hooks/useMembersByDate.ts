import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useMembersByDate(date: string) {
  return useQuery({ queryKey: ['members-by-date', date], queryFn: async () => {
    const response = await api.api.shifts.members.$get({ query: { date } })
    if (!response.ok) throw new Error('勤務メンバーを取得できませんでした')
    return response.json()
  }, enabled: Boolean(date) })
}
