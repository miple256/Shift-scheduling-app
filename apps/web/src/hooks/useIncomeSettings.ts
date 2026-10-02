import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { IncomeSettings } from '../types'

export function useIncomeSettings() {
  return useQuery({ queryKey: ['income-settings'], queryFn: async () => {
    const response = await api.api['income-settings'].$get()
    if (!response.ok) throw new Error('収入設定を取得できませんでした')
    return response.json()
  } })
}

export function useSaveIncomeSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: IncomeSettings) => {
      const response = await api.api['income-settings'].$put({ json: settings })
      if (!response.ok) throw new Error('収入設定を保存できませんでした')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['income-settings'] }),
  })
}
