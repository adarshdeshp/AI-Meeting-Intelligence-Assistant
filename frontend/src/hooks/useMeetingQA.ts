import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingApi } from '@/lib/meetingApi'

export function useMeetingQA(meetingId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (question: string) => {
      if (!meetingId) throw new Error('Meeting ID required')
      return meetingApi.askQuestion(meetingId, question)
    },
    onSuccess: () => {
      // Optionally invalidate queries if needed
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] })
    },
  })
}
