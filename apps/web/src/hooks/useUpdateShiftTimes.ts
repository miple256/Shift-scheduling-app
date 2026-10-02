import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useUpdateShiftTimes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, startTime, endTime }: { id: string; startTime: string; endTime: string }) => {
      const response = await api.api.shifts[':id'].$patch({ param: { id }, json: { startTime, endTime } })
      if (!response.ok) throw new Error('シフト時間を変更できませんでした')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  })
}
