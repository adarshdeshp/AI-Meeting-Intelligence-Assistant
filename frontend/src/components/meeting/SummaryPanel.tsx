'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Summary } from '@/types/meeting'

interface SummaryPanelProps {
  summary?: Summary | null
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  if (!summary) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Summary not available yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Short bullets */}
      {summary.short_bullets && summary.short_bullets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Points</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.short_bullets.map((bullet, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-primary shrink-0">•</span>
                  <span className="text-sm">{bullet}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Detailed summary */}
      {summary.detailed && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {summary.detailed}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Topics */}
      {summary.topics && summary.topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.topics.map((topic, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full bg-muted text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decisions */}
      {summary.decisions && summary.decisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {summary.decisions.map((decision, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-primary shrink-0 mt-1">✓</span>
                  <span className="text-sm">{decision}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
