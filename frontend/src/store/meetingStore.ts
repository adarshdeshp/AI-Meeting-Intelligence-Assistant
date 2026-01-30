import { create } from 'zustand'

interface MeetingState {
  selectedMeetingId: string | null
  lastUploadedFileName: string | null
  setSelectedMeetingId: (id: string | null) => void
  setLastUploadedFileName: (fileName: string | null) => void
  clearSelectedMeeting: () => void
}

export const useMeetingStore = create<MeetingState>((set) => ({
  selectedMeetingId: null,
  lastUploadedFileName: null,

  setSelectedMeetingId: (id) => set({ selectedMeetingId: id }),
  setLastUploadedFileName: (fileName) => set({ lastUploadedFileName: fileName }),

  clearSelectedMeeting: () =>
    set({
      selectedMeetingId: null,
      lastUploadedFileName: null,
    }),
}))
