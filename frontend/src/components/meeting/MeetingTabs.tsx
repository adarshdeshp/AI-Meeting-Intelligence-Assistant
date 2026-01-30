'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TranscriptPanel } from './TranscriptPanel'
import { SummaryPanel } from './SummaryPanel'
import { TasksPanel } from './TasksPanel'
import { SentimentPanel } from './SentimentPanel'
import { QAPanel } from './QAPanel'
import type { Meeting, MeetingStatus } from '@/types/meeting'
import { cn } from '@/lib/utils'

interface MeetingTabsProps {
  meeting: Meeting
  meetingId: string | null
}

function isStatusAtLeast(status: MeetingStatus, minStatus: MeetingStatus): boolean {
  const statusOrder: MeetingStatus[] = [
    'UPLOADED',
    'PROCESSING',
    'TRANSCRIBED',
    'SUMMARIZED',
    'TASKS_EXTRACTED',
    'SENTIMENT_ANALYZED',
    'READY',
  ]
  const statusIndex = statusOrder.indexOf(status)
  const minIndex = statusOrder.indexOf(minStatus)
  return statusIndex >= minIndex || status === 'READY' || status === 'FAILED' || status === 'ERROR'
}

export function MeetingTabs({ meeting, meetingId }: MeetingTabsProps) {
  const { status } = meeting

  const transcriptEnabled = isStatusAtLeast(status, 'TRANSCRIBED')
  const summaryEnabled = isStatusAtLeast(status, 'SUMMARIZED')
  const tasksEnabled = isStatusAtLeast(status, 'TASKS_EXTRACTED')
  const sentimentEnabled = isStatusAtLeast(status, 'SENTIMENT_ANALYZED')
  const qaEnabled = status === 'READY'

  return (
    <Tabs defaultValue="transcript" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger
          value="transcript"
          disabled={!transcriptEnabled}
          className={cn(!transcriptEnabled && 'opacity-50')}
        >
          Transcript
        </TabsTrigger>
        <TabsTrigger
          value="summary"
          disabled={!summaryEnabled}
          className={cn(!summaryEnabled && 'opacity-50')}
        >
          Summary
        </TabsTrigger>
        <TabsTrigger
          value="tasks"
          disabled={!tasksEnabled}
          className={cn(!tasksEnabled && 'opacity-50')}
        >
          Tasks
        </TabsTrigger>
        <TabsTrigger
          value="sentiment"
          disabled={!sentimentEnabled}
          className={cn(!sentimentEnabled && 'opacity-50')}
        >
          Sentiment
        </TabsTrigger>
        <TabsTrigger
          value="qa"
          disabled={!qaEnabled}
          className={cn(!qaEnabled && 'opacity-50')}
        >
          Ask AI
        </TabsTrigger>
      </TabsList>

      <TabsContent value="transcript" className="mt-4">
        <TranscriptPanel transcript={meeting.transcript} />
      </TabsContent>

      <TabsContent value="summary" className="mt-4">
        <SummaryPanel summary={meeting.summary} />
      </TabsContent>

      <TabsContent value="tasks" className="mt-4">
        <TasksPanel tasks={meeting.tasks} />
      </TabsContent>

      <TabsContent value="sentiment" className="mt-4">
        <SentimentPanel sentiment={meeting.sentiment} />
      </TabsContent>

      <TabsContent value="qa" className="mt-4">
        <QAPanel meetingId={meetingId} status={status} />
      </TabsContent>
    </Tabs>
  )
}
