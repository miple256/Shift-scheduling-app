import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useDeleteShift() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.api.shifts[':id'].$delete({ param: { id } })
      if (!response.ok) throw new Error('シフトを削除できませんでした')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  })
}
