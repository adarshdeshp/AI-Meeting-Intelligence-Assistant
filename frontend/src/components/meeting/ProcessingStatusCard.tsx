'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Check, X, Loader2 } from 'lucide-react'
import type { MeetingStatus } from '@/types/meeting'
import { cn } from '@/lib/utils'

interface ProcessingStatusCardProps {
  status: MeetingStatus
  progress?: number
  traceId?: string
  error?: string | { stage?: string; message?: string }
}

const STAGES: Array<{ status: MeetingStatus; label: string; progress: number }> = [
  { status: 'UPLOADED', label: 'Uploaded', progress: 10 },
  { status: 'PROCESSING', label: 'Processing', progress: 20 },
  { status: 'TRANSCRIBED', label: 'Transcribed', progress: 60 },
  { status: 'SUMMARIZED', label: 'Summarized', progress: 80 },
  { status: 'TASKS_EXTRACTED', label: 'Tasks Extracted', progress: 90 },
  { status: 'SENTIMENT_ANALYZED', label: 'Sentiment Analyzed', progress: 95 },
  { status: 'READY', label: 'Ready', progress: 100 },
]

function getStatusColor(status: MeetingStatus): string {
  switch (status) {
    case 'READY':
      return 'bg-green-500/20 text-green-500 border-green-500/30'
    case 'FAILED':
    case 'ERROR':
      return 'bg-destructive/20 text-destructive border-destructive/30'
    case 'PROCESSING':
    case 'TRANSCRIBED':
    case 'SUMMARIZED':
    case 'TASKS_EXTRACTED':
    case 'SENTIMENT_ANALYZED':
      return 'bg-primary/20 text-primary border-primary/30'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function getProgressValue(status: MeetingStatus, progress?: number): number {
  if (progress !== undefined) return progress
  const stage = STAGES.find((s) => s.status === status)
  return stage?.progress || 0
}

export function ProcessingStatusCard({
  status,
  progress,
  traceId,
  error,
}: ProcessingStatusCardProps) {
  const progressValue = getProgressValue(status, progress)
  const currentStageIndex = STAGES.findIndex((s) => s.status === status)
  const isFailed = status === 'FAILED' || status === 'ERROR'
  const isReady = status === 'READY'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Processing Status</CardTitle>
            <CardDescription>
              {isReady
                ? 'Meeting analysis complete'
                : isFailed
                ? 'Processing failed'
                : 'This may take a few minutes'}
            </CardDescription>
          </div>
          <Badge className={cn('border', getStatusColor(status))}>
            {status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Stage stepper */}
        <div className="space-y-2">
          {STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex || isReady
            const isCurrent = index === currentStageIndex && !isFailed && !isReady
            const isFailedStage = isFailed && index === currentStageIndex

            return (
              <div
                key={stage.status}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-md transition-colors',
                  isCurrent && 'bg-primary/10'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border-2 shrink-0',
                    isCompleted && !isFailedStage
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isFailedStage
                      ? 'bg-destructive border-destructive text-destructive-foreground'
                      : isCurrent
                      ? 'border-primary'
                      : 'border-muted'
                  )}
                >
                  {isCompleted && !isFailedStage ? (
                    <Check className="h-4 w-4" />
                  ) : isFailedStage ? (
                    <X className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-muted" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm',
                    isCompleted || isCurrent
                      ? 'font-medium'
                      : 'text-muted-foreground'
                  )}
                >
                  {stage.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Error display */}
        {isFailed && error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 space-y-2">
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-sm text-destructive/80">
              {typeof error === 'string'
                ? error
                : error.message || `Failed at stage: ${error.stage || 'unknown'}`}
            </p>
          </div>
        )}

        {/* Trace ID (debug info) */}
        {traceId && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">Debug Info</summary>
            <div className="mt-2 p-2 bg-muted/50 rounded font-mono">
              Trace ID: {traceId}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}
