'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import type { Transcript, TranscriptSegment } from '@/types/meeting'
import { cn } from '@/lib/utils'

interface TranscriptPanelProps {
  transcript?: Transcript | null
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')

  if (!transcript) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Transcript not available yet</p>
        </CardContent>
      </Card>
    )
  }

  const segments = transcript.segments || []
  const fullText = transcript.full_text || ''

  // Filter segments by search query
  const filteredSegments = searchQuery
    ? segments.filter((seg) =>
        seg.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : segments

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcript</CardTitle>
        {transcript.language && (
          <p className="text-sm text-muted-foreground">
            Language: {transcript.language}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Transcript content */}
        <ScrollArea className="h-[600px] rounded-md border p-4">
          {filteredSegments.length > 0 ? (
            <div className="space-y-4">
              {filteredSegments.map((segment, index) => {
                const isHighlighted = searchQuery
                  ? segment.text.toLowerCase().includes(searchQuery.toLowerCase())
                  : false

                return (
                  <div
                    key={index}
                    className={cn(
                      'flex gap-4 p-3 rounded-md transition-colors',
                      isHighlighted && 'bg-primary/10'
                    )}
                  >
                    <div className="shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `[${formatTime(segment.start)}] ${segment.text}`
                          )
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground font-mono"
                      >
                        {formatTime(segment.start)}
                      </button>
                    </div>
                    <div className="flex-1">
                      {segment.speaker && (
                        <span className="text-xs font-medium text-primary mb-1 block">
                          {segment.speaker}
                        </span>
                      )}
                      <p className="text-sm leading-relaxed">{segment.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? 'No matches found' : 'No transcript segments available'}
            </div>
          )}
        </ScrollArea>

        {/* Full text fallback */}
        {segments.length === 0 && fullText && (
          <div className="rounded-md border p-4">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{fullText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
