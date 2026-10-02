import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { MemberColor } from '../types'

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
    mutationFn: async (profile: { name: string; phone: string; color: MemberColor }) => {
      const response = await api.api.me.$patch({ json: profile })
      if (!response.ok) throw new Error('プロフィールを保存できませんでした')
    },
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
      queryClient.invalidateQueries({ queryKey: ['members-by-date'] }),
    ]),
  })
}
