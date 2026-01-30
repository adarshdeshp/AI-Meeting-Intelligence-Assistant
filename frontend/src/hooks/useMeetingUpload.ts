import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meetingApi } from '@/lib/meetingApi'
import { useMeetingStore } from '@/store/meetingStore'

export function useMeetingUpload() {
  const {
    setSelectedMeetingId,
    setLastUploadedFileName,
    selectedMeetingId,
  } = useMeetingStore()

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, title }: { file: File; title?: string }) => {
      const upload = await meetingApi.uploadMeeting(file, title)

      // 🔥 THIS WAS MISSING
      await meetingApi.processMeeting(upload.meeting_id)

      setLastUploadedFileName(file.name)
      return upload
    },

    onSuccess: (data) => {
      const newMeetingId = data.meeting_id

      if (selectedMeetingId && selectedMeetingId !== newMeetingId) {
        queryClient.removeQueries({ queryKey: ['meeting-status', selectedMeetingId] })
        queryClient.removeQueries({ queryKey: ['meeting', selectedMeetingId] })
      }

      setSelectedMeetingId(newMeetingId)

      queryClient.invalidateQueries({
        queryKey: ['meeting-status', newMeetingId],
      })
    },
  })
}
