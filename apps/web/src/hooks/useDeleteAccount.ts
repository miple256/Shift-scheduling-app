import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.api.me.$delete()
      if (!response.ok) throw new Error('アカウントを削除できませんでした')
    },
  })
}
