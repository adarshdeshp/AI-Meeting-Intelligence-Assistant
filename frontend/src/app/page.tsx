'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { UploadMeetingCard } from '@/components/meeting/UploadMeetingCard'
import { ProcessingStatusCard } from '@/components/meeting/ProcessingStatusCard'
import { MeetingTabs } from '@/components/meeting/MeetingTabs'
import { useMeetingStore } from '@/store/meetingStore'
import { useMeetingStatus } from '@/hooks/useMeetingStatus'
import { useMeeting } from '@/hooks/useMeeting'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function Page() {
  const { selectedMeetingId } = useMeetingStore()
  const statusQuery = useMeetingStatus(selectedMeetingId)
  const meetingQuery = useMeeting(selectedMeetingId)
  const queryClient = useQueryClient()

  // 🔥 CRITICAL: clear zombie cached polling on first load
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ['meeting-status'] })
    queryClient.removeQueries({ queryKey: ['meeting'] })
  }, [queryClient])

  // Refresh meeting data once when READY
  useEffect(() => {
    if (!selectedMeetingId) return
    if (statusQuery.data?.status !== 'READY') return

    queryClient.invalidateQueries({ queryKey: ['meeting', selectedMeetingId] })
  }, [selectedMeetingId, statusQuery.data?.status, queryClient])

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Meeting Intelligence</h1>
          <p className="text-muted-foreground">
            Upload a meeting recording to generate transcript, summary, tasks,
            sentiment and Q&A.
          </p>
        </div>

        <UploadMeetingCard />

        {selectedMeetingId && (
          <div className="space-y-6">
            {statusQuery.data && (
              <ProcessingStatusCard
                status={statusQuery.data.status}
                progress={statusQuery.data.progress}
                traceId={statusQuery.data.trace_id}
                error={statusQuery.data.error}
              />
            )}

            {meetingQuery.data ? (
              <MeetingTabs
                meeting={meetingQuery.data}
                meetingId={selectedMeetingId}
              />
            ) : meetingQuery.isLoading ? (
              <Card>
                <CardContent className="py-12">
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Meeting data will appear as processing completes
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!selectedMeetingId && (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">
                Upload a meeting recording above to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
