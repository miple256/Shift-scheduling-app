import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: async () => {
    const response = await api.api.me.$get()
    if (!response.ok) throw new Error('プロフィールを取得できませんでした')
    return response.json()
  } })
}

export function useSaveProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (profile: { name: string; phone: string }) => {
      const response = await api.api.me.$patch({ json: profile })
      if (!response.ok) throw new Error('プロフィールを保存できませんでした')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  })
}
