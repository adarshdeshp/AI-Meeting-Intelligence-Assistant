'use client'

import { X, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/uiStore'
import { useMeetingStore } from '@/store/meetingStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useRouter } from 'next/navigation'

export function RightPanel() {
  const { setRightPanelOpen } = useUIStore()
  const { selectedMeetingId, clearSelectedMeeting } = useMeetingStore()
  const router = useRouter()

  const handleCopyLink = () => {
    if (selectedMeetingId) {
      const url = `${window.location.origin}/history/${selectedMeetingId}`
      navigator.clipboard.writeText(url)
    }
  }

  const handleClearMeeting = () => {
    clearSelectedMeeting()
    router.push('/')
  }

  return (
    <aside className="w-80 border-l border-border bg-card/50 backdrop-blur-sm shrink-0">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <h2 className="text-sm font-semibold">Meeting Tools</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightPanelOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedMeetingId ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Meeting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-mono text-muted-foreground break-all">
                    {selectedMeetingId}
                  </p>
                </CardContent>
              </Card>

              <Separator />

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCopyLink}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Meeting Link
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={handleClearMeeting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Meeting
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No meeting selected
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </aside>
  )
}
