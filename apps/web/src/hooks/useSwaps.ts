import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useSwaps() {
  return useQuery({ queryKey: ['swaps'], queryFn: async () => {
    const response = await api.api.swaps.$get()
    if (!response.ok) throw new Error('交代通知を取得できませんでした')
    return response.json()
  } })
}

export function useSwapCandidates(date: string, type: 'lunch' | 'dinner') {
  return useQuery({ queryKey: ['swap-candidates', date, type], queryFn: async () => {
    const response = await api.api.swaps.candidates.$get({ query: { date, type } })
    if (!response.ok) throw new Error('交代候補を取得できませんでした')
    return response.json()
  }, enabled: Boolean(date) })
}

export function useCreateSwap() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { date: string; type: 'lunch' | 'dinner'; fromUserId: string; toUserId: string }) => {
      const response = await api.api.swaps.$post({ json: input })
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? '交代を登録できませんでした')
    },
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: ['shifts'] }), queryClient.invalidateQueries({ queryKey: ['swaps'] })]),
  })
}
