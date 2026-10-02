import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Shift } from '../types'

export function useShifts(month?: string) {
  return useQuery({
    queryKey: ['shifts', month],
    queryFn: async () => {
      const response = await api.api.shifts.$get({ query: month ? { month } : {} })
      if (!response.ok) throw new Error('シフトを取得できませんでした')
      return response.json()
    },
  })
}

export function useSaveShifts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (shifts: Shift[]) => {
      if (!shifts.length) return { created: 0 }
      const response = await api.api.shifts.$post({ json: { shifts: shifts.map(({ date, type, startTime, endTime }) => ({ date, type, startTime, endTime })) } })
      if (!response.ok) throw new Error('シフトを登録できませんでした')
      return response.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  })
}
