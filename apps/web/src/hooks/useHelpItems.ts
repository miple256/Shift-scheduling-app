import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useHelpItems() {
  return useQuery({ queryKey: ['help-items'], queryFn: async () => {
    const response = await api.api.help.$get()
    if (!response.ok) throw new Error('ヘルプを取得できませんでした')
    return response.json()
  } })
}

export function useSubmitHelpItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { question: string; answer: string }) => {
      const response = await api.api.help.$post({ json: input })
      if (!response.ok) throw new Error('投稿できませんでした')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['help-items'] }),
  })
}
