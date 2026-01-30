import { useQuery } from '@tanstack/react-query'
import { meetingApi } from '@/lib/meetingApi'

export function useMeeting(meetingId: string | null) {
  return useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => {
      if (!meetingId) throw new Error('Meeting ID required')
      return meetingApi.getMeeting(meetingId)
    },
    enabled: !!meetingId,
    staleTime: 0, // Always refetch to get latest data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })
}
