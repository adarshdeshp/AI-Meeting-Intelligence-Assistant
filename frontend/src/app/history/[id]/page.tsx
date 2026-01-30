'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { ProcessingStatusCard } from '@/components/meeting/ProcessingStatusCard'
import { MeetingTabs } from '@/components/meeting/MeetingTabs'
import { useMeetingStore } from '@/store/meetingStore'
import { useMeetingStatus } from '@/hooks/useMeetingStatus'
import { useMeeting } from '@/hooks/useMeeting'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function MeetingDetailPage() {
  const params = useParams()
  const meetingId = params.id as string
  const { setSelectedMeetingId } = useMeetingStore()
  const statusQuery = useMeetingStatus(meetingId)
  const meetingQuery = useMeeting(meetingId)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (meetingId) {
      setSelectedMeetingId(meetingId)
    }
  }, [meetingId, setSelectedMeetingId])

  // Invalidate and refetch meeting details when status becomes READY
  useEffect(() => {
    const status = statusQuery.data?.status
    if (!meetingId || !status) return

    if (status === 'READY') {
      // Force refresh the full meeting document when status becomes READY
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] })
      queryClient.refetchQueries({ queryKey: ['meeting', meetingId] })
    }
  }, [meetingId, statusQuery.data?.status, queryClient])

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Meeting Details</h1>
          <p className="text-muted-foreground">
            {meetingQuery.data?.title || `Meeting ${meetingId}`}
          </p>
        </div>

        {/* Status card */}
        {statusQuery.data && (
          <ProcessingStatusCard
            status={statusQuery.data.status}
            progress={statusQuery.data.progress}
            traceId={statusQuery.data.trace_id}
            error={statusQuery.data.error}
          />
        )}

        {/* Meeting tabs */}
        {meetingQuery.data ? (
          <MeetingTabs meeting={meetingQuery.data} meetingId={meetingId} />
        ) : meetingQuery.isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {statusQuery.data?.status === 'READY'
                  ? 'Loading meeting data...'
                  : 'Meeting data will appear as processing completes'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
