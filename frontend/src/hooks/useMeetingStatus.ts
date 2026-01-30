import { useQuery } from '@tanstack/react-query'
import { meetingApi } from '@/lib/meetingApi'
import type { MeetingStatus, MeetingStatusResponse } from '@/types/meeting'

const FINAL_STATUSES: MeetingStatus[] = ['READY', 'FAILED', 'ERROR']

export function useMeetingStatus(meetingId: string | null) {
  return useQuery<MeetingStatusResponse>({
    queryKey: ['meeting-status', meetingId],
    queryFn: () => {
      if (!meetingId) throw new Error('Meeting ID required')
      return meetingApi.getMeetingStatus(meetingId)
    },
    enabled: !!meetingId,

    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 2000

      if (FINAL_STATUSES.includes(data.status)) return false
      return 2000
    },

    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,

    refetchOnMount: true,
    refetchOnWindowFocus: false,

    // 🔥 Important for polling UIs
    notifyOnChangeProps: 'all',
    structuralSharing: false,
  })
}
