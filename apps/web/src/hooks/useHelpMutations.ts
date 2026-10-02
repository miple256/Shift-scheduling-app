import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

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

export function useApproveHelpItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.api.help[':id'].approve.$patch({ param: { id } })
      if (!response.ok) throw new Error('管理者権限がないか、投稿が見つかりません')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['help-items'] }),
  })
}
